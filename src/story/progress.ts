import Dexie, { type EntityTable } from 'dexie';
import type { RunState } from './runner';

export const MAX_HEARTS = 4;
export interface Progress {
  playerName: string;
  hearts: Record<string, number>;
  wins: Record<string, number>;
  losses: Record<string, number>;
  /** Cenas "únicas" já vistas. */
  seen: string[];
  /** Cena em andamento (null = no mapa). */
  run: { scene: string; state: RunState } | null;
}
export const newProgress = (playerName: string): Progress => ({ playerName, hearts: {}, wins: {}, losses: {}, seen: [], run: null });

interface Row { id: string; progress: Progress; updatedAt: number }
const db = new Dexie('ygo-story') as Dexie & { saves: EntityTable<{ id: string }, 'id'>; progress: EntityTable<Row, 'id'> };
db.version(1).stores({ saves: 'id' });
db.version(2).stores({ saves: 'id', progress: 'id' });

export const loadProgress = async (): Promise<Progress | null> => {
  try { return (await db.progress.get('main'))?.progress ?? null; } catch { return null; }
};
export const writeProgress = async (progress: Progress) => {
  try { await db.progress.put({ id: 'main', progress, updatedAt: Date.now() }); } catch { /* sem armazenamento: segue sem salvar */ }
};
export const clearProgress = async () => { try { await db.progress.delete('main'); } catch { /* idem */ } };
