import type { JWTVerifyGetKey } from 'jose';
import { identify } from './auth';
import type { Env } from './d1';
import { MAX_DEVICE_CHARS, MAX_SAVE_BYTES } from './protocol';
import { keepDiscarded, readSave, writeSave } from './saves';

const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: HEADERS });

const isRev = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
const isVersion = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0;
const deviceOf = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, MAX_DEVICE_CHARS) : null);

class HttpError extends Error { constructor(readonly status: number) { super(String(status)); } }

async function bodyOf(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) throw new HttpError(413);
  try {
    const b = JSON.parse(text);
    if (b && typeof b === 'object' && !Array.isArray(b)) return b;
  } catch { /* abaixo */ }
  throw new HttpError(400);
}

/** `/api/save` (contrato em `protocol.ts`). `keys` e `now` só mudam nos testes. */
export async function handleSave(req: Request, env: Env, opts: { keys?: JWTVerifyGetKey; now?: () => number } = {}): Promise<Response> {
  const email = await identify(req, env, opts.keys);
  if (!email) return json(401, { error: 'sem identidade' });
  const now = (opts.now ?? Date.now)();
  try {
    switch (req.method) {
      case 'GET': {
        const s = await readSave(env.DB, email);
        return s ? json(200, s) : json(404, { error: 'sem save' });
      }
      case 'PUT': {
        const b = await bodyOf(req);
        const device = deviceOf(b.device);
        if (!isRev(b.baseRev) || !isVersion(b.version) || !b.data || typeof b.data !== 'object' || !device) return json(400, { error: 'corpo inválido' });
        const r = await writeSave(env.DB, email, b.baseRev, b.version, b.data, device, now);
        return r.ok ? json(200, { rev: r.rev }) : json(409, r.current);
      }
      case 'DELETE': {
        const b = await bodyOf(req);
        const device = deviceOf(b.device);
        if (!isRev(b.baseRev) || !device) return json(400, { error: 'corpo inválido' });
        const cur = await readSave(env.DB, email);
        if (!cur && b.baseRev === 0) return json(200, { rev: 0 }); // nada a apagar
        const version = cur?.version ?? 1;
        const r = await writeSave(env.DB, email, b.baseRev, version, null, device, now);
        return r.ok ? json(200, { rev: r.rev }) : json(409, r.current);
      }
      case 'POST': {
        const b = await bodyOf(req);
        const device = deviceOf(b.device);
        if (!isVersion(b.version) || (b.data !== null && typeof b.data !== 'object') || !device) return json(400, { error: 'corpo inválido' });
        await keepDiscarded(env.DB, email, b.version, b.data ?? null, device, now);
        return json(204);
      }
      default:
        return json(405, { error: 'método' });
    }
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.status === 413 ? 'save grande demais' : 'corpo inválido' });
    throw e;
  }
}
