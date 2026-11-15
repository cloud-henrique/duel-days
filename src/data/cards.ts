import type { CardRecord } from '../engine/session';

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
