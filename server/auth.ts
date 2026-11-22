import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { Env } from './d1';

/** As chaves públicas da equipe do Access, guardadas entre pedidos (o `jose` renova sozinho quando a chave muda). */
const remote = new Map<string, JWTVerifyGetKey>();
export const accessKeys = (team: string): JWTVerifyGetKey => {
  let k = remote.get(team);
  if (!k) { k = createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`)); remote.set(team, k); }
  return k;
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * O e-mail de quem fez o pedido, pelo JWT que o Cloudflare Access injeta (`Cf-Access-Jwt-Assertion`), ou nulo se não
 * houver identidade válida. A assinatura é conferida com as chaves da equipe, o `aud` com o da aplicação e o emissor
 * com o domínio da equipe. Em dev, `DEV_EMAIL` vale no lugar do JWT, mas só para pedidos a `localhost`.
 */
export async function identify(req: Request, env: Env, keys: JWTVerifyGetKey = accessKeys(env.ACCESS_TEAM)): Promise<string | null> {
  if (env.DEV_EMAIL && LOCAL_HOSTS.has(new URL(req.url).hostname)) return env.DEV_EMAIL.trim().toLowerCase();
  const token = req.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || !env.ACCESS_AUD || !env.ACCESS_TEAM) return null;
  try {
    const { payload } = await jwtVerify(token, keys, { issuer: `https://${env.ACCESS_TEAM}`, audience: env.ACCESS_AUD });
    return typeof payload.email === 'string' && payload.email ? payload.email.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}
