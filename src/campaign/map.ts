/** O mapa: quem aparece em cada período, em que ponto do panorama, e quando os chefes chegam. */
import { BALANCE } from './balance';
import { CAMPAIGN, DUELISTS, TIERS, type DuelistData, type MapPoint, type TierData } from './data/types';
import { PURPOSE, generator, randInt, shuffle } from './rng';
import type { CampaignState } from './state';
import { FIRST_TIER, bossBeaten, bossOf, currentTier, regularsOf, tierOf } from './tiers';

/** Pontos fixos do Tier 1 (os saves em andamento veem cada um onde estava). */
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
 * Os duelistas no mapa agora: de 2 a 4 comuns do tier atual; todos os comuns dos tiers anteriores (continuam na
 * cidade); e os chefes liberados de todos os tiers abertos. Tudo pela semente, pelo dia e pelo período. Campanha
 * terminada: ninguém.
 */
export function present(s: CampaignState): DuelistData[] {
  if (s.concluded) return [];
  const cur = currentTier(s);
  // O Tier 1 mantém a mistura de antes (os saves em andamento veem a mesma gente).
  const g = cur === FIRST_TIER ? generator(PURPOSE.opponents, s.seed, s.day, s.period)
    : generator(PURPOSE.opponents, s.seed, s.day, s.period, cur.number);
  const regulars = drawSome(regularsOf(cur), BALANCE.opponentsMin, BALANCE.opponentsMax, g);
  const past = TIERS.filter((t) => t.number < cur.number).flatMap((t) => regularsOf(t));
  const bosses = TIERS.filter((t) => t.number <= cur.number && isBossAvailable(s, t)).map((t) => bossOf(t)!);
  return [...regulars, ...past, ...bosses];
}

export const isPresent = (s: CampaignState, key: string) => present(s).some((d) => d.key === key);

/**
 * Faixas do panorama (x em fração da largura, que é o dobro da altura). A tela do celular abre mostrando o meio
 * (~x 0,32–0,68): o tier atual fica nele; cada tier anterior, um anel mais para os lados (meio à vista, meio rolando).
 * Em y, da beira das montanhas à do mar.
 */
const RING = { innerHalf: 0.13, step: 0.13, yMin: 0.17, yMax: 0.7 } as const;
/** Distância mínima entre duas cabeças, em alturas do panorama (a cabeça tem ~0,1). */
const MIN_GAP = 0.17;

/** A faixa de x do anel `k` (0 = tier atual): o meio, ou as duas laterais simétricas. */
function ringX(k: number, g: () => number): number {
  if (k === 0) return 0.5 - RING.innerHalf + g() * RING.innerHalf * 2;
  const from = RING.innerHalf + 0.02 + (k - 1) * RING.step;
  const off = from + g() * (RING.step - 0.02);
  return Math.min(0.95, Math.max(0.05, g() < 0.5 ? 0.5 - off : 0.5 + off));
}

/**
 * Onde cada um aparece. Tier 1: os pontos fixos do panorama, sorteados. Depois: o tier atual espalhado no meio, os
 * anteriores mais longe do centro, sem duas cabeças encostadas. Tudo pela semente, pelo dia e pelo período.
 */
export function placements(s: CampaignState): { duelist: DuelistData; point: MapPoint }[] {
  const people = present(s);
  const g = generator(PURPOSE.mapPoints, s.seed, s.day, s.period);
  const cur = currentTier(s);
  if (cur === FIRST_TIER) {
    const points = shuffle(MAP_POINTS, g);
    return people.slice(0, points.length).map((duelist, i) => ({ duelist, point: points[i] }));
  }
  const placed: MapPoint[] = [];
  // Distância na mesma unidade nos dois eixos: x vale o dobro (o panorama é 2:1).
  const far = (p: MapPoint, gap: number) => placed.every((q) => Math.hypot((p.x - q.x) * 2, p.y - q.y) >= gap);
  return people.map((duelist) => {
    const k = Math.max(0, cur.number - tierOf(duelist.key).number);
    let best: MapPoint | null = null, bestGap = -1;
    for (let tries = 0; tries < 60; tries++) {
      const p = { x: round(ringX(k, g)), y: round(RING.yMin + g() * (RING.yMax - RING.yMin)) };
      if (far(p, MIN_GAP)) { best = p; break; }
      const gap = Math.min(...placed.map((q) => Math.hypot((p.x - q.x) * 2, p.y - q.y)));
      if (gap > bestGap) { bestGap = gap; best = p; }
    }
    placed.push(best!);
    return { duelist, point: best! };
  });
}
const round = (v: number) => Math.round(v * 1000) / 1000;

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
