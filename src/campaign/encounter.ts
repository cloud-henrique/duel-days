/** Qual fala toca no encontro: saudação, antes e depois do duelo (`Campaign+Dialogue` do nativo). */
import { BALANCE } from './balance';
import { bondEvent, eventScenes, openBondEvent } from './bond';
import { DIALOGUE, duelistByKey, type Scene } from './data/types';
import { seedPosition } from './map';
import { PURPOSE, generator, randInt } from './rng';
import type { CampaignState, DuelKind } from './state';
import { bossBeaten, tierOf } from './tiers';

/** Os "momentos" entram no sorteio da variante (dois momentos do mesmo período não saem sempre iguais). */
const MOMENT = { greeting: 0, beforeDuel: 1, playerWins: 2, playerLoses: 3, close: 100, friendship: 101, romance: 102 } as const;

function variant(s: CampaignState, key: string, scenes: Scene[], moment: number): Scene {
  if (!scenes.length) return [];
  const g = generator(PURPOSE.dialogue, s.seed, s.day, s.period, seedPosition(key), moment);
  return scenes[randInt(g, scenes.length)];
}

/**
 * Chefe (ou o duelo final) ainda não vencido: a entrada e a derrota de chefe só tocam até a primeira vitória.
 */
function unbeatenBoss(s: CampaignState, key: string): boolean {
  const d = duelistByKey(key);
  if (d?.isFinal) return !(s.victories[key] ?? 0);
  return !!d?.isBoss && !bossBeaten(s, tierOf(key));
}

export type GreetingBand = 'close' | 'friendship' | 'romance' | null;

/** A faixa da saudação: a da rota escolhida, senão "próximos" a partir de 2 corações, senão a comum (null). */
export function greetingBand(s: CampaignState, key: string): GreetingBand {
  const route = s.bondRoutes[key];
  if (route) return route;
  return (s.affinity[key] ?? 0) >= BALANCE.closeGreetingHearts * BALANCE.pointsPerHeart ? 'close' : null;
}

/** A saudação: a de primeiro encontro (quem tem), senão a da faixa do laço, senão a comum. */
export function greetingScene(s: CampaignState, key: string, first = !s.met.includes(key)): Scene {
  const dl = DIALOGUE.duelists[key];
  if (first && dl.firstGreeting?.length) return variant(s, key, dl.firstGreeting, MOMENT.greeting);
  const band = greetingBand(s, key);
  const banded = band ? dl.bondGreetings?.[band] : undefined;
  if (band && banded?.length) return variant(s, key, banded, MOMENT[band]);
  return variant(s, key, dl.greeting, MOMENT.greeting);
}

/** A cena do evento de laço aberto, se for o duelo do evento. */
function eventFor(s: CampaignState, key: string, kind: DuelKind) {
  if (kind !== 'bondEvent') return null;
  const n = openBondEvent(s, key);
  const ev = n ? bondEvent(key, n) : undefined;
  return ev ? eventScenes(ev, s.bondRoutes[key]) : null;
}

/** Fala de antes do duelo: a do evento; senão a entrada do chefe ainda não vencido; senão uma comum. */
export function preDuelScene(s: CampaignState, key: string, kind: DuelKind): Scene {
  const ev = eventFor(s, key, kind);
  if (ev) return ev.before;
  const dl = DIALOGUE.duelists[key];
  if (unbeatenBoss(s, key) && dl.bossEntrance) return dl.bossEntrance;
  return variant(s, key, dl.beforeDuel, MOMENT.beforeDuel);
}

export type DuelResult = 'win' | 'lose' | 'draw' | 'forfeit';

/**
 * Fala de depois do duelo, calculada com o estado de ANTES do resultado. Derrota: a de derrota. Vitória: o fim do
 * evento, a derrota do chefe (primeira vez), a primeira vitória ou a vitória comum, o que valer primeiro.
 */
export function postDuelScene(s: CampaignState, key: string, result: DuelResult, kind: DuelKind): Scene {
  const dl = DIALOGUE.duelists[key];
  if (result !== 'win') return variant(s, key, dl.playerLoses, MOMENT.playerLoses);
  const ev = eventFor(s, key, kind);
  if (ev) return ev.after;
  if (unbeatenBoss(s, key) && dl.bossDefeat) return dl.bossDefeat;
  if ((s.victories[key] ?? 0) === 0 && dl.firstWin?.length) return dl.firstWin;
  return variant(s, key, dl.playerWins, MOMENT.playerWins);
}
