import Dexie, { type EntityTable } from 'dexie';
import type { RunState } from './runner';
import type { Deck } from '../game/decks';
import { START_COINS } from '../game/economy';

export const MAX_HEARTS = 4;

/** Preferências do jogador (menu do duelo). */
export interface Settings {
  /** Velocidade das animações do duelo. */
  anim: 'normal' | 'fast' | 'off';
  sound: boolean;
}
export const DEFAULT_SETTINGS: Settings = { anim: 'normal', sound: true };
const ANIM: readonly Settings['anim'][] = ['normal', 'fast', 'off'];
/** Preferências salvas completadas com o padrão (saves antigos não têm `settings`; valores estranhos voltam ao padrão). */
export const withDefaults = (saved?: Partial<Settings> | null): Settings => ({
  anim: saved?.anim && ANIM.includes(saved.anim) ? saved.anim : DEFAULT_SETTINGS.anim,
  sound: typeof saved?.sound === 'boolean' ? saved.sound : DEFAULT_SETTINGS.sound,
});
export interface Progress {
  playerName: string;
  hearts: Record<string, number>;
  wins: Record<string, number>;
  losses: Record<string, number>;
  /** Cenas "únicas" já vistas. */
  seen: string[];
  coins: number;
  /** Cartas possuídas: passcode -> quantidade. */
  collection: Record<string, number>;
  decks: Deck[];
  activeDeck: string;
  /** Cena em andamento (null = no mapa). */
  run: { scene: string; state: RunState } | null;
  /** Preferências; ausente em saves antigos (leia com `withDefaults`). */
  settings?: Partial<Settings>;
}
export const newProgress = (playerName: string, starter: Record<string, number>): Progress => {
  const main = Object.entries(starter).flatMap(([id, n]) => Array<number>(n).fill(Number(id)));
  return {
    playerName, hearts: {}, wins: {}, losses: {}, seen: [], run: null,
    coins: START_COINS, collection: { ...starter },
    decks: [{ id: 'deck1', name: 'Deck inicial', main, extra: [] }], activeDeck: 'deck1',
  };
};

interface Row { id: string; progress: Progress; updatedAt: number }
const db = new Dexie('duel-days') as Dexie & { saves: EntityTable<{ id: string }, 'id'>; progress: EntityTable<Row, 'id'> };
db.version(1).stores({ saves: 'id' });
db.version(2).stores({ saves: 'id', progress: 'id' });

export const loadProgress = async (): Promise<Progress | null> => {
  try {
    const p = (await db.progress.get('main'))?.progress ?? null;
    // Saves antigos (sem economia) são descartados: precisam de uma coleção inicial.
    return p && p.collection && p.decks ? p : null;
  } catch { return null; }
};
export const writeProgress = async (progress: Progress) => {
  try { await db.progress.put({ id: 'main', progress, updatedAt: Date.now() }); } catch { /* sem armazenamento: segue sem salvar */ }
};
export const clearProgress = async () => { try { await db.progress.delete('main'); } catch { /* idem */ } };
