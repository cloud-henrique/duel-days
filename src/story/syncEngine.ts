/**
 * O motor da sincronização do save (change save-na-nuvem): quando enviar, quando buscar, o que fazer com a resposta e o
 * estado que a tela mostra. O jogo nunca espera por ele: toda gravação vai antes para o IndexedDB (`progress.ts`).
 *
 * Gatilhos: abrir o app (`start`), cada gravação (`notifyWrite`, com espera de `DEBOUNCE_MS` para juntar as seguidas),
 * o app indo para o segundo plano (envio na hora, com `keepalive`), a volta do segundo plano e a volta da rede (`reconcile`).
 */
import type { RemoteSave } from '../../server/protocol';
import type { LocalSave, Progress } from './progress';
import { reconcile as decide, remoteProgress, versionOf } from './sync';
import type { ApiResult, Failure, SyncApi } from './syncClient';

export type SyncStatus =
  | 'off' | 'checking' | 'syncing' | 'synced' | 'pending' | 'expired' | 'conflict' | 'update';

export interface SyncState {
  status: SyncStatus;
  /** Hora da última vez que o aparelho e a nuvem ficaram iguais. */
  lastSync: number | null;
  /** Os dois lados, quando `status` é `conflict`. */
  conflict: { local: LocalSave; remote: RemoteSave } | null;
  /** Por que está desligada: endereço (`?sync=off`), campanha de depuração ou sem servidor (`npm run dev`). */
  offReason?: 'param' | 'debug' | 'local';
}

export interface LocalStore {
  load(): Promise<LocalSave>;
  markSynced(rev: number, seq: number): Promise<void>;
  replace(progress: Progress | null, rev: number): Promise<void>;
}

export interface SyncDeps {
  api: SyncApi;
  store: LocalStore;
  device: () => string;
  /**
   * O save do aparelho foi trocado pelo da nuvem, gravado no aparelho `device`. `open`: na abertura; `resume`: com o app
   * aberto (voltou do segundo plano, voltou a rede); `choice`: o jogador escolheu a nuvem num conflito.
   */
  onPulled: (progress: Progress | null, when: 'open' | 'resume' | 'choice', device: string) => void;
  /** Pode trocar o save agora? (Durante um duelo, não: a troca espera.) */
  canPull?: () => boolean;
  enabled: boolean | 'param' | 'debug';
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (t: unknown) => void;
}

export const DEBOUNCE_MS = 2000;
/** Quanto a abertura espera a nuvem antes de liberar a campanha com o save do aparelho. */
export const OPEN_WAIT_MS = 3000;

export function createSyncEngine(deps: SyncDeps) {
  const now = deps.now ?? Date.now;
  const setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((t) => clearTimeout(t as ReturnType<typeof setTimeout>));
  const enabled = deps.enabled === true;
  let state: SyncState = enabled
    ? { status: 'checking', lastSync: null, conflict: null }
    : { status: 'off', lastSync: null, conflict: null, offReason: deps.enabled === 'debug' ? 'debug' : 'param' };
  const listeners = new Set<() => void>();
  const set = (patch: Partial<SyncState>) => {
    state = { ...state, ...patch };
    if (state.status !== 'conflict') state.conflict = null;
    listeners.forEach((l) => l());
  };
  const synced = () => set({ status: 'synced', lastSync: now() });
  const failed = (f: Failure, local?: LocalSave) => {
    if (f === 'local') return set({ status: 'off', offReason: 'local' });
    if (f === 'expired') return set({ status: 'expired' });
    set({ status: local && !local.dirty ? 'synced' : 'pending' });
  };
  /** Pausado: sem rede de nada adianta tentar até o próximo gatilho; conflito e versão nova esperam o jogador. */
  const stuck = () => state.status === 'off' || state.status === 'conflict' || state.status === 'update';

  // Uma operação por vez; um gatilho no meio só marca que é preciso rodar de novo.
  let running: Promise<void> | null = null;
  let again: null | 'reconcile' | 'flush' = null;
  let keepalive = false;
  const exclusive = (job: 'reconcile' | 'flush'): Promise<void> => {
    if (running) { if (again !== 'reconcile') again = job; return running; }
    running = (async () => {
      try { await (job === 'reconcile' ? doReconcile() : doFlush()); } finally { running = null; }
      const next = again; again = null;
      if (next) await exclusive(next);
    })();
    return running;
  };

  let pulledWhen: 'open' | 'resume' = 'open';

  /** Aplica a decisão para o save do aparelho e a nuvem. `remote` indefinido: buscar antes. */
  async function settle(local: LocalSave, remote: RemoteSave | null): Promise<void> {
    for (let tries = 0; tries < 3; tries++) {
      const a = decide(local, remote);
      switch (a.kind) {
        case 'none':
          if (local.dirty && !local.debug) await deps.store.markSynced(remote?.rev ?? 0, local.seq);
          return synced();
        case 'update':
          return set({ status: 'update' });
        case 'conflict':
          return set({ status: 'conflict', conflict: { local, remote: a.remote } });
        case 'pull': {
          if (deps.canPull && !deps.canPull()) return set({ status: 'pending' });
          const p = remoteProgress(a.remote);
          await deps.store.replace(p, a.remote.rev);
          deps.onPulled(p, pulledWhen, a.remote.device);
          return synced();
        }
        case 'push': {
          const r = await push(local, a.baseRev);
          if (r.ok) return;
          if ('failure' in r) return failed(r.failure, local);
          remote = r.conflict; // a nuvem andou entre a busca e o envio: decide de novo
          local = await deps.store.load();
        }
      }
    }
    set({ status: 'pending' });
  }

  /** Envia o save do aparelho (ou o apagar) sobre `baseRev`; no sucesso, deixa de estar pendente. */
  async function push(local: LocalSave, baseRev: number): Promise<ApiResult<number>> {
    set({ status: 'syncing' });
    const device = deps.device();
    const opts = { keepalive };
    const r = local.progress === null
      ? await deps.api.remove({ baseRev, device }, opts)
      : await deps.api.put({ baseRev, version: versionOf(local.progress), data: local.progress, device }, opts);
    if (r.ok) {
      await deps.store.markSynced(r.value, local.seq);
      const after = await deps.store.load();
      if (after.dirty) schedule(); else synced();
    }
    return r;
  }

  async function doReconcile() {
    if (!enabled || state.status === 'conflict') return;
    if (state.status !== 'checking') set({ status: 'syncing' });
    const local = await deps.store.load();
    const r = await deps.api.get();
    if (!r.ok) return failed('failure' in r ? r.failure : 'error', local);
    await settle(local, r.value);
  }

  async function doFlush() {
    if (!enabled || stuck()) return;
    const local = await deps.store.load();
    if (!local.dirty || local.debug) return;
    const r = await push(local, local.baseRev);
    if (r.ok) return;
    if ('failure' in r) return failed(r.failure, local);
    await settle(await deps.store.load(), r.conflict);
  }

  let timer: unknown = null;
  function schedule() {
    if (!enabled || stuck()) return;
    if (state.status === 'synced') set({ status: 'pending' });
    if (timer !== null) clearTimer(timer);
    timer = setTimer(() => { timer = null; void exclusive('flush'); }, DEBOUNCE_MS);
  }

  return {
    getState: () => state,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    /** A primeira busca, na abertura. */
    start: () => { pulledWhen = 'open'; return exclusive('reconcile'); },
    /** Busca de novo (volta do segundo plano, volta da rede, depois de entrar no Access). */
    reconcile: () => {
      pulledWhen = 'resume';
      if (state.status === 'update' || state.status === 'expired') set({ status: 'syncing' });
      return exclusive('reconcile');
    },
    /** Uma gravação no aparelho: envia depois da espera. */
    notifyWrite: schedule,
    /** Envia agora o que estiver pendente (o app foi para o segundo plano). */
    flushNow: async () => {
      if (timer !== null) { clearTimer(timer); timer = null; }
      keepalive = true;
      try { await exclusive('flush'); } finally { keepalive = false; }
    },
    /** A escolha do jogador num conflito. O lado que perde fica entre as versões anteriores da nuvem. */
    async resolve(choice: 'cloud' | 'local') {
      const c = state.conflict;
      if (!c) return;
      const local = await deps.store.load();
      if (choice === 'cloud') {
        const kept = await deps.api.discard({ version: versionOf(local.progress), data: local.progress, device: deps.device() });
        if (!kept.ok) return failed('failure' in kept ? kept.failure : 'error', { ...local, dirty: true });
        const p = remoteProgress(c.remote);
        await deps.store.replace(p, c.remote.rev);
        deps.onPulled(p, 'choice', c.remote.device);
        return synced();
      }
      set({ status: 'syncing' });
      const r = await push(local, c.remote.rev);
      if (r.ok) return;
      if ('failure' in r) return failed(r.failure, local);
      set({ status: 'conflict', conflict: { local: await deps.store.load(), remote: r.conflict } });
    },
    /** Liga os gatilhos do navegador; devolve como desligá-los. */
    attach(win: Window, doc: Document) {
      if (!enabled) return () => {};
      const vis = () => { if (doc.visibilityState === 'hidden') void this.flushNow(); else void this.reconcile(); };
      const online = () => { void this.reconcile(); };
      doc.addEventListener('visibilitychange', vis);
      win.addEventListener('online', online);
      return () => { doc.removeEventListener('visibilitychange', vis); win.removeEventListener('online', online); };
    },
  };
}

export type SyncEngine = ReturnType<typeof createSyncEngine>;
