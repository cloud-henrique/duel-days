import Dexie, { type EntityTable } from 'dexie';
import type { RunState } from './runner';

interface SaveRow { id: string; state: RunState; updatedAt: number }
const db = new Dexie('ygo-story') as Dexie & { saves: EntityTable<SaveRow, 'id'> };
db.version(1).stores({ saves: 'id' });

export const loadSave = async (): Promise<RunState | null> => {
  try { return (await db.saves.get('main'))?.state ?? null; } catch { return null; }
};
export const writeSave = async (state: RunState) => {
  try { await db.saves.put({ id: 'main', state, updatedAt: Date.now() }); } catch { /* sem armazenamento: segue sem salvar */ }
};
export const clearSave = async () => { try { await db.saves.delete('main'); } catch { /* idem */ } };
