/**
 * Os pedidos a `/api/save` (contrato em `server/protocol.ts`), traduzidos para o que a sincronização precisa saber:
 * deu certo, a nuvem andou (409) ou por que não deu (sem rede, sessão do Access vencida, sem servidor).
 */
import type { DeleteBody, DiscardBody, PutBody, RemoteSave } from '../../server/protocol';

export type Failure =
  /** Sem rede (o `fetch` falhou). */
  | 'offline'
  /** A sessão do Access venceu: o pedido foi redirecionado para o login (ou a função não viu identidade). */
  | 'expired'
  /** Não há `/api/` aqui (o `npm run dev` puro devolve a página do app). */
  | 'local'
  /** Qualquer outra resposta inesperada. */
  | 'error';

export type ApiResult<T> = { ok: true; value: T } | { ok: false; conflict: RemoteSave } | { ok: false; failure: Failure };

export interface SyncApi {
  get(): Promise<ApiResult<RemoteSave | null>>;
  put(body: PutBody, opts?: { keepalive?: boolean }): Promise<ApiResult<number>>;
  remove(body: DeleteBody, opts?: { keepalive?: boolean }): Promise<ApiResult<number>>;
  discard(body: DiscardBody): Promise<ApiResult<null>>;
}

/** O `keepalive` só vale até 64 KB de corpo (somando os pedidos em voo); acima disso, o pedido vai sem ele. */
const KEEPALIVE_MAX = 60_000;

const isJson = (r: Response) => (r.headers.get('Content-Type') ?? '').includes('application/json');

export function httpApi(url = `${import.meta.env.BASE_URL}api/save`, fetcher: typeof fetch = (...a) => fetch(...a)): SyncApi {
  async function call(method: string, body?: unknown, keepalive = false): Promise<{ res: Response } | { failure: Failure }> {
    const text = body === undefined ? undefined : JSON.stringify(body);
    let res: Response;
    try {
      res = await fetcher(url, {
        method, body: text, credentials: 'include', redirect: 'manual', cache: 'no-store',
        headers: text ? { 'Content-Type': 'application/json' } : undefined,
        keepalive: keepalive && (text?.length ?? 0) < KEEPALIVE_MAX,
      });
    } catch {
      return { failure: 'offline' };
    }
    if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400) || res.status === 401 || res.status === 403) {
      return { failure: 'expired' };
    }
    if (!isJson(res) && res.status !== 204) return { failure: 'local' };
    return { res };
  }
  const read = async <T,>(r: Awaited<ReturnType<typeof call>>, ok: (res: Response) => Promise<T>, notFound?: T): Promise<ApiResult<T>> => {
    if ('failure' in r) return { ok: false, failure: r.failure };
    const { res } = r;
    try {
      if (res.ok) return { ok: true, value: await ok(res) };
      if (res.status === 404 && notFound !== undefined) return { ok: true, value: notFound };
      if (res.status === 409) return { ok: false, conflict: (await res.json()) as RemoteSave };
    } catch { /* corpo estranho: erro */ }
    return { ok: false, failure: 'error' };
  };
  const rev = async (res: Response) => ((await res.json()) as { rev: number }).rev;
  return {
    get: async () => read(await call('GET'), async (res) => (await res.json()) as RemoteSave, null as RemoteSave | null),
    put: async (body, opts) => read(await call('PUT', body, opts?.keepalive), rev),
    remove: async (body, opts) => read(await call('DELETE', body, opts?.keepalive), rev),
    discard: async (body) => read(await call('POST', body), async () => null),
  };
}
