import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { SyncEngine, SyncState } from '../../story/syncEngine';

/** O motor da sincronização para as telas (o indicador, a escolha do conflito). Sem provedor, as telas não mostram nada. */
const Ctx = createContext<{ engine: SyncEngine; openConflict: () => void } | null>(null);

export function SyncProvider({ engine, openConflict, children }: { engine: SyncEngine; openConflict: () => void; children: ReactNode }) {
  return <Ctx.Provider value={{ engine, openConflict }}>{children}</Ctx.Provider>;
}

const OFF: SyncState = { status: 'off', lastSync: null, conflict: null };
const noop = () => () => {};

/** O estado atual da sincronização (e o motor), ou nulo sem provedor. */
export function useSync(): { state: SyncState; engine: SyncEngine; openConflict: () => void } | null {
  const ctx = useContext(Ctx);
  const state = useSyncExternalStore(ctx ? ctx.engine.subscribe : noop, ctx ? ctx.engine.getState : () => OFF);
  return ctx ? { state, engine: ctx.engine, openConflict: ctx.openConflict } : null;
}
