import Dexie, { type EntityTable } from 'dexie';
import { CAMPAIGN_VERSION, type CampaignState } from '../campaign/state';

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
 * estatísticas e os ajustes, e fica sem campanha: ela começa do dia 1. O mesmo vale para uma campanha de outra versão
 * (a de antes do Speed Duel, por exemplo).
 */
/**
 * Campanha de antes das escolhas nos eventos (change lacos-ate-o-fim): os eventos já vencidos não pedem escolha depois.
 */
function withPicks(c: CampaignState): CampaignState {
  if (c.bondPicks) return c;
  return { ...c, bondPicks: {}, bondPicksFrom: { ...c.bondEventsDone } };
}

/**
 * A campanha do save: a desta versão (com as escolhas dos eventos), nenhuma se for de uma versão anterior e, se for de
 * uma versão mais nova que o app (gravada em outro aparelho já atualizado), a mesma, intacta: descartá-la apagaria o
 * progresso quando o save voltasse para a nuvem (change save-na-nuvem).
 */
function campaignOf(raw: unknown): CampaignState | null {
  const c = raw as CampaignState | null | undefined;
  if (!c || typeof c.version !== 'number') return null;
  if (c.version === CAMPAIGN_VERSION) return withPicks(c);
  return c.version > CAMPAIGN_VERSION ? c : null;
}

export function migrate(raw: unknown): Progress | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<Progress> & Record<string, unknown>;
  if (typeof p.playerName !== 'string') return null;
  const out: Progress = {
    playerName: p.playerName,
    wins: (p.wins as Record<string, number>) ?? {},
    losses: (p.losses as Record<string, number>) ?? {},
    campaign: campaignOf(p.campaign),
  };
  if (p.avatar !== undefined) out.avatar = p.avatar;
  if (p.address !== undefined) out.address = p.address;
  if (p.settings !== undefined) out.settings = p.settings;
  return out;
}

/**
 * O registro do save no IndexedDB. Além do `Progress`, o estado da sincronização com a nuvem (change save-na-nuvem):
 * `baseRev` é a revisão da nuvem da qual este save descende (0 = nunca sincronizou), `dirty` diz que há mudança que a
 * nuvem não tem e `seq` conta as gravações (um envio só limpa o `dirty` se nada foi gravado enquanto ele ia). `progress`
 * nulo com `dirty` é um "Apagar progresso" que a nuvem ainda não recebeu. Registros de antes da sincronização não têm
 * esses campos: valem 0, pendente e 0 (`syncOf`). `debug` marca um save mudado por uma campanha de depuração: ele nunca
 * vai para a nuvem, e a próxima sincronização o troca pelo da conta.
 */
interface Row { id: string; progress: Progress | null; updatedAt: number; baseRev?: number; dirty?: boolean; seq?: number; debug?: boolean }
const db = new Dexie('duel-days') as Dexie & { saves: EntityTable<{ id: string }, 'id'>; progress: EntityTable<Row, 'id'> };
db.version(1).stores({ saves: 'id' });
db.version(2).stores({ saves: 'id', progress: 'id' });

/** O save do aparelho com o estado da sincronização. */
export interface LocalSave { progress: Progress | null; baseRev: number; dirty: boolean; seq: number; updatedAt: number; debug: boolean }
const syncOf = (r: Row | undefined): Omit<LocalSave, 'progress'> => ({
  baseRev: r?.baseRev ?? 0, dirty: r ? (r.dirty ?? r.progress !== null) : false, seq: r?.seq ?? 0,
  updatedAt: r?.updatedAt ?? 0, debug: r?.debug ?? false,
});
const MAIN = 'main';

export const loadLocal = async (): Promise<LocalSave> => {
  try {
    const r = await db.progress.get(MAIN);
    return { progress: migrate(r?.progress ?? null), ...syncOf(r) };
  } catch { return { progress: null, baseRev: 0, dirty: false, seq: 0, updatedAt: 0, debug: false }; }
};
export const loadProgress = async (): Promise<Progress | null> => (await loadLocal()).progress;

/** Grava uma mudança do jogo: fica pendente para a nuvem. Devolve o `seq` da gravação. */
const writeLocal = async (progress: Progress | null, dirty: (baseRev: number) => boolean, debug?: boolean): Promise<number> => {
  try {
    return await db.transaction('rw', db.progress, async () => {
      const cur = syncOf(await db.progress.get(MAIN));
      const seq = cur.seq + 1;
      await db.progress.put({ id: MAIN, progress, updatedAt: Date.now(), baseRev: cur.baseRev, dirty: dirty(cur.baseRev), seq,
        debug: debug ?? cur.debug });
      return seq;
    });
  } catch { return 0; /* sem armazenamento: segue sem salvar */ }
};
export const writeProgress = (progress: Progress) => writeLocal(progress, () => true);
/** Grava um save mudado por uma campanha de depuração (`?campaign=…`): fica marcado e nunca vai para a nuvem. */
export const writeDebugProgress = (progress: Progress) => writeLocal(progress, () => true, true);
/** Apaga o save do aparelho; se ele já esteve na nuvem, o apagar fica pendente para ela também. */
export const clearProgress = () => writeLocal(null, (baseRev) => baseRev > 0, false);

/** A nuvem aceitou o envio da gravação `seq` com a revisão `rev`: só deixa de estar pendente se nada mudou depois. */
export const markSynced = async (rev: number, seq: number) => {
  try {
    await db.transaction('rw', db.progress, async () => {
      const r = await db.progress.get(MAIN);
      if (!r) return;
      await db.progress.put({ ...r, baseRev: rev, dirty: syncOf(r).seq === seq ? false : syncOf(r).dirty });
    });
  } catch { /* idem */ }
};

/** Troca o save do aparelho pelo da nuvem (revisão `rev`), sem nada pendente. */
export const replaceLocal = async (progress: Progress | null, rev: number) => {
  try {
    await db.transaction('rw', db.progress, async () => {
      const seq = syncOf(await db.progress.get(MAIN)).seq + 1;
      await db.progress.put({ id: MAIN, progress, updatedAt: Date.now(), baseRev: rev, dirty: false, seq });
    });
  } catch { /* idem */ }
};

/** Só nos testes: zera o banco. */
export const __resetLocal = () => db.progress.clear();
