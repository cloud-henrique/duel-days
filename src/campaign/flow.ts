/** Passos do encontro que mudam o save: conhecer o duelista e começar/abandonar um duelo. */
import { playableEvent } from './bond';
import { isPresent } from './map';
import { clone, type CampaignState, type DuelKind } from './state';

export function meet(s0: CampaignState, key: string): CampaignState {
  if (s0.met.includes(key)) return s0;
  const s = clone(s0);
  s.met.push(key);
  return s;
}

export const canDuel = (s: CampaignState, key: string, kind: DuelKind) =>
  !s.concluded && isPresent(s, key) && (kind === 'regular' || playableEvent(s, key) !== null);

/** Marca o duelo em andamento: se o app fechar no meio, o período não é gasto e o jogo pergunta ao voltar. */
export function beginDuel(s0: CampaignState, key: string, kind: DuelKind): CampaignState {
  if (!canDuel(s0, key, kind)) throw new Error(`não dá para duelar com ${key} agora`);
  const s = clone(s0);
  s.pendingDuel = { duelist: key, kind };
  return s;
}

export function abandonDuel(s0: CampaignState): CampaignState {
  if (!s0.pendingDuel) return s0;
  const s = clone(s0);
  s.pendingDuel = null;
  return s;
}
