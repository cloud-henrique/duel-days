/** O mapa: quem aparece em cada período, em que ponto do panorama, e quando os chefes chegam. */
import { BALANCE } from './balance';
import { CAMPAIGN, DUELISTS, TIERS, type DuelistData, type MapPoint, type TierData } from './data/types';
import { PURPOSE, generator, randInt, shuffle } from './rng';
import type { CampaignState } from './state';
import { FIRST_TIER, bossBeaten, bossOf, currentTier, regularsOf } from './tiers';

export const MAP_POINTS: readonly MapPoint[] = CAMPAIGN.mapPoints;
/** Os amigos do Tier 1 que continuam no mapa nos tiers seguintes (os comuns com laço). */
export const FRIENDS: readonly DuelistData[] = regularsOf(FIRST_TIER).filter((d) => d.bond);
/** Posição do duelista no elenco (Tier 1 primeiro): entra nos sorteios por duelista. */
export const seedPosition = (key: string) => DUELISTS.findIndex((d) => d.key === key);

export const beatenRegulars = (s: CampaignState, t: TierData = currentTier(s)) =>
  regularsOf(t).filter((d) => (s.victories[d.key] ?? 0) > 0);
/** O chefe do tier aparece depois de cada comum dele vencido ao menos uma vez. */
export const isBossAvailable = (s: CampaignState, t: TierData = currentTier(s)) =>
  !!bossOf(t) && beatenRegulars(s, t).length === regularsOf(t).length;

/** De `min` a `max` da lista (limitado ao que existe), na ordem do elenco, para a lista não "pular". */
function drawSome(list: readonly DuelistData[], min: number, max: number, g: () => number): DuelistData[] {
  const count = Math.min(list.length, min + randInt(g, max - min + 1));
  const drawn = new Set(shuffle(list, g).slice(0, count).map((d) => d.key));
  return list.filter((d) => drawn.has(d.key));
}

/**
 * Os duelistas no mapa agora: de 2 a 4 comuns do tier atual; a partir do Tier 2, de 1 a 2 amigos do Tier 1; e os
 * chefes liberados de todos os tiers abertos. Tudo pela semente, pelo dia e pelo período. Campanha terminada: ninguém.
 */
export function present(s: CampaignState): DuelistData[] {
  if (s.concluded) return [];
  const cur = currentTier(s);
  // O Tier 1 mantém a mistura de antes (os saves em andamento veem a mesma gente).
  const g = cur === FIRST_TIER ? generator(PURPOSE.opponents, s.seed, s.day, s.period)
    : generator(PURPOSE.opponents, s.seed, s.day, s.period, cur.number);
  const regulars = drawSome(regularsOf(cur), BALANCE.opponentsMin, BALANCE.opponentsMax, g);
  const friends = cur === FIRST_TIER ? []
    : drawSome(FRIENDS, BALANCE.friendsMin, BALANCE.friendsMax, generator(PURPOSE.friends, s.seed, s.day, s.period));
  const bosses = TIERS.filter((t) => t.number <= cur.number && isBossAvailable(s, t)).map((t) => bossOf(t)!);
  return [...regulars, ...friends, ...bosses];
}

export const isPresent = (s: CampaignState, key: string) => present(s).some((d) => d.key === key);

/** Onde cada um aparece: pontos diferentes do panorama, sorteados pela semente, pelo dia e pelo período. */
export function placements(s: CampaignState): { duelist: DuelistData; point: MapPoint }[] {
  const people = present(s);
  const points = shuffle(MAP_POINTS, generator(PURPOSE.mapPoints, s.seed, s.day, s.period));
  return people.slice(0, points.length).map((duelist, i) => ({ duelist, point: points[i] }));
}

/** A linha do progresso do tier atual no cabeçalho. */
export function tierProgress(s: CampaignState) {
  const t = currentTier(s);
  const boss = bossOf(t);
  const bossName = boss?.name ?? 'o chefe';
  const status = boss && bossBeaten(s, t) ? `${bossName} vencido`
    : isBossAvailable(s, t) ? `${bossName} está esperando!`
    : `vença todos para desafiar ${bossName}`;
  return { name: t.name, number: t.number, beaten: beatenRegulars(s, t).length, total: regularsOf(t).length, boss: status };
}
