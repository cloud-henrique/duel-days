import type { CardRecord } from '../engine/session';
/** Raridade no pool (a da primeira impressão): N comum, R rara, SR super, UR ultra. */
export type Tier = 'N' | 'R' | 'SR' | 'UR';

export type Cards = Record<string, CardRecord>;
const BASE = import.meta.env.BASE_URL;

/** Carrega o banco de cartas e sobrepõe nome e efeito em português quando existirem. */
export async function loadCards(): Promise<Cards> {
  const cards: Cards = await (await fetch(`${BASE}data/cards.json`)).json();
  try {
    const pt: Record<string, { name: string; desc: string }> = await (await fetch(`${BASE}data/text.pt.json`)).json();
    for (const [id, t] of Object.entries(pt)) if (cards[id]) { cards[id].name = t.name; cards[id].desc = t.desc; }
  } catch { /* sem tradução: segue em inglês */ }
  return cards;
}

export interface GameData { cards: Cards; tiers: Record<string, Tier>; poolIds: number[] }

/** Cartas + raridades. `poolIds` são as cartas colecionáveis (o banco tem também fichas, que não entram na coleção). */
export async function loadData(): Promise<GameData> {
  const [cards, tiers] = await Promise.all([loadCards(), fetch(`${BASE}data/pool.json`).then((r) => r.json() as Promise<Record<string, Tier>>)]);
  return { cards, tiers, poolIds: Object.keys(tiers).map(Number) };
}
