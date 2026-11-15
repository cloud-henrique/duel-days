import { PACK_PRICE } from './economy';

export type Tier = 'N' | 'R' | 'SR' | 'UR';
export const PACK_SIZE = 5;
export const TIER_NAME: Record<Tier, string> = { N: 'Normal', R: 'Rara', SR: 'Super Rara', UR: 'Ultra Rara' };

// Chance por raridade: 4 cartas "livres" + 1 com raridade mínima R garantida.
const FREE: [Tier, number][] = [['N', 0.76], ['R', 0.18], ['SR', 0.05], ['UR', 0.01]];
const GUARANTEED: [Tier, number][] = [['R', 0.70], ['SR', 0.24], ['UR', 0.06]];
const roll = (table: [Tier, number][], r: number): Tier => {
  let acc = 0;
  for (const [t, p] of table) { acc += p; if (r < acc) return t; }
  return table[table.length - 1][0];
};

export interface Pulled { code: number; tier: Tier }

/** Abre um pack. `tiers` mapeia passcode -> raridade; `rng` devolve [0,1). */
export function openPack(tiers: Record<string, Tier>, rng: () => number = Math.random): Pulled[] {
  const byTier: Record<Tier, number[]> = { N: [], R: [], SR: [], UR: [] };
  for (const [id, t] of Object.entries(tiers)) byTier[t].push(Number(id));
  const pull = (t: Tier): Pulled => {
    // Se a raridade estiver vazia no pool, desce uma faixa.
    const order: Tier[] = ['UR', 'SR', 'R', 'N'];
    const use = order.slice(order.indexOf(t)).find((x) => byTier[x].length)!;
    const list = byTier[use];
    return { code: list[Math.floor(rng() * list.length)], tier: use };
  };
  return [...Array.from({ length: PACK_SIZE - 1 }, () => pull(roll(FREE, rng()))), pull(roll(GUARANTEED, rng()))];
}

export const packCost = (n: number) => n * PACK_PRICE;
