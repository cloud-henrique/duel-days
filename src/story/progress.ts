import Dexie, { type EntityTable } from 'dexie';
import type { CampaignState } from '../campaign/state';

/** Preferências do jogador (ajustes do título e do menu do duelo). */
export interface Settings {
  /** Velocidade das animações do duelo. */
  anim: 'normal' | 'fast' | 'off';
  /** Efeitos sonoros. */
  sound: boolean;
  /** Música de fundo e o volume dela (0 a 1). */
  music: boolean;
  musicVolume: number;
  /** Correntes opcionais do jogador: perguntar se quer responder ou passar sempre ("não" automático). */
  chain: 'ask' | 'skip';
}
export const DEFAULT_SETTINGS: Settings = { anim: 'normal', sound: true, music: true, musicVolume: 0.6, chain: 'ask' };
const ANIM: readonly Settings['anim'][] = ['normal', 'fast', 'off'];
const isVolume = (v: unknown): v is number => typeof v === 'number' && v >= 0 && v <= 1;
/** Preferências salvas completadas com o padrão (saves antigos não têm `settings`; valores estranhos voltam ao padrão). */
export const withDefaults = (saved?: Partial<Settings> | null): Settings => ({
  anim: saved?.anim && ANIM.includes(saved.anim) ? saved.anim : DEFAULT_SETTINGS.anim,
  sound: typeof saved?.sound === 'boolean' ? saved.sound : DEFAULT_SETTINGS.sound,
  music: typeof saved?.music === 'boolean' ? saved.music : DEFAULT_SETTINGS.music,
  musicVolume: isVolume(saved?.musicVolume) ? saved.musicVolume : DEFAULT_SETTINGS.musicVolume,
  chain: saved?.chain === 'skip' ? 'skip' : 'ask',
});

/**
 * O save: o perfil (nome, avatar, tratamento), as estatísticas de todos os duelos, os ajustes e a campanha. A coleção, os
 * decks e o DP são da campanha (change `campanha-dm`); `campaign: null` = nenhuma campanha começada.
 */
export interface Progress {
  playerName: string;
  /** Vitórias e derrotas por oponente (estatísticas do perfil; somam todas as campanhas). */
  wins: Record<string, number>;
  losses: Record<string, number>;
  /** Avatar do jogador (pasta em `public/characters`); ausente em saves antigos (leia com `profileOf`). */
  avatar?: string;
  /** Tratamento nos textos com gênero; ausente em saves antigos (`profileOf` dá "neutral"). */
  address?: 'he' | 'she' | 'neutral';
  /** Preferências; ausente em saves antigos (leia com `withDefaults`). */
  settings?: Partial<Settings>;
  campaign: CampaignState | null;
}

export const newProgress = (playerName: string): Progress => ({ playerName, wins: {}, losses: {}, campaign: null });

/**
 * Lê um save qualquer como o de agora. O da história antiga (com `run`, `coins`, `collection`…) mantém o perfil, as
 * estatísticas e os ajustes, e fica sem campanha: ela começa do dia 1.
 */
export function migrate(raw: unknown): Progress | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<Progress> & Record<string, unknown>;
  if (typeof p.playerName !== 'string') return null;
  const out: Progress = {
    playerName: p.playerName,
    wins: (p.wins as Record<string, number>) ?? {},
    losses: (p.losses as Record<string, number>) ?? {},
    campaign: p.campaign && (p.campaign as CampaignState).version === 1 ? (p.campaign as CampaignState) : null,
  };
  if (p.avatar !== undefined) out.avatar = p.avatar;
  if (p.address !== undefined) out.address = p.address;
  if (p.settings !== undefined) out.settings = p.settings;
  return out;
}

interface Row { id: string; progress: Progress; updatedAt: number }
const db = new Dexie('duel-days') as Dexie & { saves: EntityTable<{ id: string }, 'id'>; progress: EntityTable<Row, 'id'> };
db.version(1).stores({ saves: 'id' });
db.version(2).stores({ saves: 'id', progress: 'id' });

export const loadProgress = async (): Promise<Progress | null> => {
  try { return migrate((await db.progress.get('main'))?.progress ?? null); } catch { return null; }
};
export const writeProgress = async (progress: Progress) => {
  try { await db.progress.put({ id: 'main', progress, updatedAt: Date.now() }); } catch { /* sem armazenamento: segue sem salvar */ }
};
export const clearProgress = async () => { try { await db.progress.delete('main'); } catch { /* idem */ } };
