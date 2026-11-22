import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../server/d1';
import { handleSave } from '../../server/handler';
import { historyOf } from '../../server/saves';
import { sqliteD1 } from '../../server/testing/sqliteD1';
import { newProgress, type LocalSave, type Progress } from './progress';
import { httpApi } from './syncClient';
import { createSyncEngine, DEBOUNCE_MS, type LocalStore } from './syncEngine';

/** Um aparelho: o save local em memória com a mesma regra do `progress.ts`. */
function device(label: string, env: Env, opts: { enabled?: boolean | 'param' | 'debug'; canPull?: () => boolean } = {}) {
  let row: LocalSave = { progress: null, baseRev: 0, dirty: false, seq: 0, updatedAt: 0, debug: false };
  const store: LocalStore & { write(p: Progress | null): void; row(): LocalSave } = {
    load: async () => ({ ...row }),
    markSynced: async (rev, seq) => { row = { ...row, baseRev: rev, dirty: row.seq === seq ? false : row.dirty }; },
    replace: async (progress, rev) => { row = { ...row, progress, baseRev: rev, dirty: false, seq: row.seq + 1, debug: false }; },
    write: (p) => { row = { ...row, progress: p, dirty: p ? true : row.baseRev > 0, seq: row.seq + 1 }; },
    row: () => row,
  };
  const calls: string[] = [];
  let online = true;
  const fetcher = (async (url: string, init?: RequestInit) => {
    if (!online) throw new TypeError('Failed to fetch');
    calls.push(init?.method ?? 'GET');
    return handleSave(new Request(url, init), env);
  }) as typeof fetch;
  const timers: (() => void)[] = [];
  const pulled: (Progress | null)[] = [];
  const engine = createSyncEngine({
    api: httpApi('http://localhost/api/save', fetcher), store, device: () => label,
    onPulled: (p) => { pulled.push(p); }, canPull: opts.canPull, enabled: opts.enabled ?? true,
    setTimer: (fn) => { timers.push(fn); return timers.length; }, clearTimer: (t) => { timers[(t as number) - 1] = () => {}; },
  });
  return {
    engine, store, calls, pulled,
    setOnline: (v: boolean) => { online = v; },
    /** Dispara as esperas pendentes e aguarda o envio. */
    async tick() { const fns = timers.splice(0); fns.forEach((f) => f()); await engine.flushNow(); },
    async play(name: string) { store.write({ ...newProgress(name) }); engine.notifyWrite(); },
  };
}

let env: Env;
beforeEach(() => { env = { DB: sqliteD1(), ACCESS_AUD: 'x', ACCESS_TEAM: 'x', DEV_EMAIL: 'ana@x.com' }; });

describe('cliente HTTP', () => {
  const api = (res: () => Response | Promise<Response>) => httpApi('http://localhost/api/save', (async () => res()) as typeof fetch);
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('sem rede, sessão vencida, sem servidor e 404 da conta vazia', async () => {
    expect(await httpApi('http://x', (async () => { throw new TypeError('x'); }) as typeof fetch).get()).toEqual({ ok: false, failure: 'offline' });
    expect(await api(() => ({ type: 'opaqueredirect', status: 0, ok: false, headers: new Headers() }) as Response).get()).toEqual({ ok: false, failure: 'expired' });
    expect(await api(() => json(401, {})).get()).toEqual({ ok: false, failure: 'expired' });
    expect(await api(() => new Response('<html>', { status: 200, headers: { 'Content-Type': 'text/html' } })).get()).toEqual({ ok: false, failure: 'local' });
    expect(await api(() => new Response('Not found', { status: 404 })).get()).toEqual({ ok: false, failure: 'local' });
    expect(await api(() => json(404, { error: 'sem save' })).get()).toEqual({ ok: true, value: null });
    expect(await api(() => json(500, {})).get()).toEqual({ ok: false, failure: 'error' });
  });

  it('409 traz o que a nuvem tem', async () => {
    const remote = { rev: 3, version: 2, data: null, device: 'Mac', updatedAt: 1 };
    expect(await api(() => json(409, remote)).put({ baseRev: 1, version: 2, data: {}, device: 'x' })).toEqual({ ok: false, conflict: remote });
  });
});

describe('motor da sincronização', () => {
  it('três gravações seguidas viram um envio só, depois da espera', async () => {
    const a = device('iPhone', env);
    await a.engine.start();
    await a.play('1'); await a.play('2'); await a.play('3');
    expect(a.calls).toEqual(['GET']);
    expect(a.engine.getState().status).toBe('pending');
    await a.tick();
    expect(a.calls).toEqual(['GET', 'PUT']);
    expect(a.store.row()).toMatchObject({ baseRev: 1, dirty: false });
    expect(a.engine.getState().status).toBe('synced');
    expect(DEBOUNCE_MS).toBe(2000);
  });

  it('do celular para o notebook: o notebook traz o save na abertura', async () => {
    const phone = device('iPhone', env);
    await phone.engine.start();
    await phone.play('Dia 5');
    await phone.tick();
    const laptop = device('Mac', env);
    await laptop.engine.start();
    expect(laptop.pulled.map((p) => p?.playerName)).toEqual(['Dia 5']);
    expect(laptop.store.row()).toMatchObject({ baseRev: 1, dirty: false });
  });

  it('offline: fica pendente e envia na volta da rede', async () => {
    const a = device('iPhone', env);
    await a.engine.start();
    a.setOnline(false);
    await a.play('offline');
    await a.tick();
    expect(a.engine.getState().status).toBe('pending');
    a.setOnline(true);
    await a.engine.reconcile();
    expect(a.engine.getState().status).toBe('synced');
    expect(a.store.row().dirty).toBe(false);
  });

  it('os dois jogaram offline: o segundo a sincronizar escolhe, e o lado que perde fica no histórico', async () => {
    const phone = device('iPhone', env); const laptop = device('Mac', env);
    await phone.engine.start(); await phone.play('base'); await phone.tick();
    await laptop.engine.start();
    await laptop.play('notebook'); await phone.play('celular');
    await laptop.tick();
    await phone.tick();
    const st = phone.engine.getState();
    expect(st.status).toBe('conflict');
    expect(st.conflict?.remote.device).toBe('Mac');
    expect(phone.store.row().progress?.playerName).toBe('celular'); // nada sobrescrito antes da escolha

    await phone.engine.resolve('cloud');
    expect(phone.store.row().progress?.playerName).toBe('notebook');
    expect(phone.engine.getState().status).toBe('synced');
    const h = await historyOf(env.DB, 'ana@x.com');
    expect(h[0]).toMatchObject({ reason: 'discarded', device: 'iPhone' });
    expect(JSON.parse(h[0].data!).playerName).toBe('celular');
  });

  it('escolher este aparelho põe o dele na nuvem', async () => {
    const phone = device('iPhone', env); const laptop = device('Mac', env);
    await phone.engine.start(); await phone.play('base'); await phone.tick();
    await laptop.engine.start(); await laptop.play('notebook'); await laptop.tick();
    await phone.play('celular'); await phone.tick();
    await phone.engine.resolve('local');
    expect(phone.engine.getState().status).toBe('synced');
    await laptop.engine.reconcile();
    expect(laptop.store.row().progress?.playerName).toBe('celular');
  });

  it('apagar num aparelho volta o outro às boas-vindas', async () => {
    const phone = device('iPhone', env); const laptop = device('Mac', env);
    await phone.engine.start(); await phone.play('Ana'); await phone.tick();
    await laptop.engine.start();
    phone.store.write(null); phone.engine.notifyWrite(); await phone.tick();
    expect(phone.calls.at(-1)).toBe('DELETE');
    await laptop.engine.reconcile();
    expect(laptop.pulled.at(-1)).toBeNull();
    expect(laptop.store.row().progress).toBeNull();
  });

  it('durante o duelo não troca o save', async () => {
    let inDuel = true;
    const phone = device('iPhone', env);
    const laptop = device('Mac', env, { canPull: () => !inDuel });
    await laptop.engine.start();
    await phone.engine.start(); await phone.play('celular'); await phone.tick();
    await laptop.engine.reconcile();
    expect(laptop.pulled).toEqual([]);
    inDuel = false;
    await laptop.engine.reconcile();
    expect(laptop.pulled.map((p) => p?.playerName)).toEqual(['celular']);
  });

  it('desligada (endereço ou depuração): nenhum pedido', async () => {
    for (const enabled of ['param', 'debug'] as const) {
      const a = device('iPhone', env, { enabled });
      await a.engine.start(); await a.play('x'); await a.tick(); await a.engine.reconcile();
      expect(a.calls).toEqual([]);
      expect(a.engine.getState()).toMatchObject({ status: 'off', offReason: enabled });
    }
  });

  it('sem servidor (dev puro): desliga', async () => {
    const engine = createSyncEngine({
      api: httpApi('http://x', (async () => new Response('<html>', { headers: { 'Content-Type': 'text/html' } })) as typeof fetch),
      store: { load: async () => ({ progress: null, baseRev: 0, dirty: false, seq: 0, updatedAt: 0, debug: false }), markSynced: vi.fn(), replace: vi.fn() },
      device: () => 'Mac', onPulled: vi.fn(), enabled: true,
    });
    await engine.start();
    expect(engine.getState()).toMatchObject({ status: 'off', offReason: 'local' });
  });
});
