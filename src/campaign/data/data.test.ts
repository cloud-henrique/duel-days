import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CAMPAIGN, DIALOGUE, PACKS } from './types';

const CARDS = 'public/data/cards.json';

/** Todo id que a campanha usa: deck inicial, decks dos oponentes, assinaturas, cartas do laço e pacotes. */
function campaignIds(): Set<number> {
  const ids = new Set<number>();
  CAMPAIGN.starterDeck.main.forEach((e) => ids.add(e.id));
  for (const d of CAMPAIGN.tier.duelists) {
    [...d.deck.main, ...d.deck.extra].forEach((e) => ids.add(e.id));
    ids.add(d.signatureCard.id);
    if (d.bondGift) ids.add(d.bondGift.id);
  }
  PACKS.forEach((p) => p.cards.forEach((c) => ids.add(c.id)));
  return ids;
}

describe('dados da campanha', () => {
  it('têm os 5 duelistas, 5 lugares e o diálogo de cada um', () => {
    expect(CAMPAIGN.tier.duelists.map((d) => d.key)).toEqual(['tristan', 'tea', 'joey', 'bakura', 'yugi']);
    expect(CAMPAIGN.tier.locations).toHaveLength(5);
    for (const d of CAMPAIGN.tier.duelists) expect(DIALOGUE.duelists[d.key]?.bondEvents).toHaveLength(4);
  });

  it('decks com 40 cartas no Main, e o deck inicial também', () => {
    const total = (es: { count: number }[]) => es.reduce((s, e) => s + e.count, 0);
    expect(total(CAMPAIGN.starterDeck.main)).toBe(40);
    for (const d of CAMPAIGN.tier.duelists) expect(total(d.deck.main), d.key).toBe(40);
  });

  it.skipIf(!existsSync(CARDS))('toda carta da campanha está no cards.json exportado', () => {
    const cards = JSON.parse(readFileSync(CARDS, 'utf8')) as Record<string, unknown>;
    const missing = [...campaignIds()].filter((id) => !cards[String(id)]);
    expect(missing).toEqual([]);
  });
});
