import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from 'jose';
import type { Env } from './d1';
import { handleSave } from './handler';
import { historyOf } from './saves';
import { sqliteD1 } from './testing/sqliteD1';

const TEAM = 'equipe.cloudflareaccess.com';
const AUD = 'aud-do-duel-days';
let keys: JWTVerifyGetKey;
let sign: (claims: { email?: string; aud?: string; iss?: string }) => Promise<string>;
let otherSign: typeof sign;

beforeAll(async () => {
  const mk = async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' };
    const signer = (c: { email?: string; aud?: string; iss?: string }) => new SignJWT(c.email ? { email: c.email } : {})
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer(c.iss ?? `https://${TEAM}`).setAudience(c.aud ?? AUD)
      .setIssuedAt().setExpirationTime('1h').sign(privateKey);
    return { jwk, signer };
  };
  const a = await mk(); const b = await mk();
  keys = createLocalJWKSet({ keys: [a.jwk] });
  sign = a.signer; otherSign = b.signer;
});

let env: Env;
let clock = 1000;
beforeEach(() => { env = { DB: sqliteD1(), ACCESS_AUD: AUD, ACCESS_TEAM: TEAM }; clock = 1000; });

const call = async (method: string, opts: { token?: string; body?: unknown; url?: string; rawBody?: string } = {}) => {
  const headers: Record<string, string> = {};
  if (opts.token) headers['Cf-Access-Jwt-Assertion'] = opts.token;
  const body = opts.rawBody ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body));
  const res = await handleSave(new Request(opts.url ?? 'https://dueldays.pages.dev/api/save', { method, headers, body }), env, { keys, now: () => clock++ });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, cache: res.headers.get('Cache-Control') };
};
const as = async (email: string) => sign({ email });
const save = (day: number) => ({ playerName: 'Ana', wins: {}, losses: {}, campaign: { day } });

describe('identidade', () => {
  it('aceita o JWT válido do Access', async () => {
    expect((await call('GET', { token: await as('Ana@Exemplo.com') })).status).toBe(404);
  });
  it('recusa sem token, assinatura de outra chave, aud ou emissor errados', async () => {
    expect((await call('GET')).status).toBe(401);
    expect((await call('GET', { token: await otherSign({ email: 'a@x.com' }) })).status).toBe(401);
    expect((await call('GET', { token: await sign({ email: 'a@x.com', aud: 'outro' }) })).status).toBe(401);
    expect((await call('GET', { token: await sign({ email: 'a@x.com', iss: 'https://outra.cloudflareaccess.com' }) })).status).toBe(401);
    expect((await call('GET', { token: await sign({}) })).status).toBe(401);
  });
  it('DEV_EMAIL só vale em localhost', async () => {
    env.DEV_EMAIL = 'dev@local';
    expect((await call('GET', { url: 'http://localhost:8788/api/save' })).status).toBe(404);
    expect((await call('GET', { url: 'https://dueldays.pages.dev/api/save' })).status).toBe(401);
  });
});

describe('GET/PUT', () => {
  it('cada e-mail lê só o próprio save, e o e-mail não diferencia maiúsculas', async () => {
    const ana = await as('ana@x.com');
    expect((await call('PUT', { token: ana, body: { baseRev: 0, version: 2, data: save(3), device: 'iPhone' } })).body).toEqual({ rev: 1 });
    const got = await call('GET', { token: await as('ANA@x.com') });
    expect(got.status).toBe(200);
    expect(got.body).toMatchObject({ rev: 1, version: 2, data: save(3), device: 'iPhone' });
    expect((await call('GET', { token: await as('bia@x.com') })).status).toBe(404);
  });

  it('envios em sequência sobem a revisão; a mesma baseRev duas vezes dá 409 com a cópia do servidor', async () => {
    const t = await as('ana@x.com');
    await call('PUT', { token: t, body: { baseRev: 0, version: 2, data: save(1), device: 'iPhone' } });
    expect((await call('PUT', { token: t, body: { baseRev: 1, version: 2, data: save(2), device: 'iPhone' } })).body).toEqual({ rev: 2 });
    const late = await call('PUT', { token: t, body: { baseRev: 1, version: 2, data: save(9), device: 'Mac' } });
    expect(late.status).toBe(409);
    expect(late.body).toMatchObject({ rev: 2, data: save(2), device: 'iPhone' });
    // O primeiro envio de outro aparelho (baseRev 0) também não passa por cima.
    expect((await call('PUT', { token: t, body: { baseRev: 0, version: 2, data: save(9), device: 'Mac' } })).status).toBe(409);
  });

  it('guarda as 10 últimas versões substituídas', async () => {
    const t = await as('ana@x.com');
    for (let i = 0; i < 14; i++) await call('PUT', { token: t, body: { baseRev: i, version: 2, data: save(i), device: 'iPhone' } });
    const h = await historyOf(env.DB, 'ana@x.com');
    expect(h).toHaveLength(10);
    expect(h[0].rev).toBe(13);
    expect(h.every((r) => r.reason === 'replaced')).toBe(true);
  });

  it('recusa corpo inválido (400) e grande demais (413)', async () => {
    const t = await as('ana@x.com');
    expect((await call('PUT', { token: t, rawBody: 'não é json' })).status).toBe(400);
    expect((await call('PUT', { token: t, body: { baseRev: -1, version: 2, data: save(1), device: 'x' } })).status).toBe(400);
    expect((await call('PUT', { token: t, body: { baseRev: 0, version: 2, data: null, device: 'x' } })).status).toBe(400);
    const big = { baseRev: 0, version: 2, data: { blob: 'x'.repeat(1024 * 1024) }, device: 'x' };
    expect((await call('PUT', { token: t, body: big })).status).toBe(413);
  });

  it('responde sempre sem cache', async () => {
    expect((await call('GET', { token: await as('ana@x.com') })).cache).toBe('no-store');
    expect((await call('GET')).cache).toBe('no-store');
  });
});

describe('DELETE e POST', () => {
  it('apagar vira lápide, com o save anterior no histórico', async () => {
    const t = await as('ana@x.com');
    await call('PUT', { token: t, body: { baseRev: 0, version: 2, data: save(5), device: 'iPhone' } });
    expect((await call('DELETE', { token: t, body: { baseRev: 1, device: 'iPhone' } })).body).toEqual({ rev: 2 });
    expect((await call('GET', { token: t })).body).toMatchObject({ rev: 2, data: null });
    const h = await historyOf(env.DB, 'ana@x.com');
    expect(h[0]).toMatchObject({ rev: 1, reason: 'erased' });
    expect(JSON.parse(h[0].data!)).toEqual(save(5));
  });

  it('apagar com baseRev velha dá 409; sem save, não faz nada', async () => {
    const t = await as('ana@x.com');
    expect((await call('DELETE', { token: t, body: { baseRev: 0, device: 'iPhone' } })).body).toEqual({ rev: 0 });
    await call('PUT', { token: t, body: { baseRev: 0, version: 2, data: save(5), device: 'iPhone' } });
    await call('PUT', { token: t, body: { baseRev: 1, version: 2, data: save(6), device: 'iPhone' } });
    expect((await call('DELETE', { token: t, body: { baseRev: 1, device: 'Mac' } })).status).toBe(409);
  });

  it('o save descartado num conflito vai para o histórico sem mudar o atual', async () => {
    const t = await as('ana@x.com');
    await call('PUT', { token: t, body: { baseRev: 0, version: 2, data: save(5), device: 'iPhone' } });
    expect((await call('POST', { token: t, body: { version: 2, data: save(4), device: 'Mac' } })).status).toBe(204);
    expect((await call('GET', { token: t })).body).toMatchObject({ rev: 1, data: save(5) });
    expect((await historyOf(env.DB, 'ana@x.com'))[0]).toMatchObject({ reason: 'discarded', device: 'Mac' });
  });
});
