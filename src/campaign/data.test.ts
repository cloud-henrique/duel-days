import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import campaign from './data/campaign.json';
import packs from './data/packs.json';

// Os dados das cartas (public/data) ficam fora do git: sem eles (ex.: CI), o teste é pulado.
const CARDS = 'public/data/cards.json';
const BOOSTERS = 'public/data/boosters.json';
const has = existsSync(CARDS) && existsSync(BOOSTERS);
const TOKEN = 0x4000;

describe.skipIf(!has)('dados da campanha contra a base de cartas', () => {
  const cards: Record<string, { type: number }> = has ? JSON.parse(readFileSync(CARDS, 'utf8')) : {};
  const boosters: { key: string; cards: { id: number; rarity: string }[] }[] = has ? JSON.parse(readFileSync(BOOSTERS, 'utf8')) : [];
  const playable = (id: number) => cards[String(id)] !== undefined && !(cards[String(id)].type & TOKEN);

  it('todo id de deck, assinatura, presente do laço e pacote existe e não é ficha', () => {
    const ids = [
      ...campaign.starterDeck.main.map((e) => e.id),
      ...campaign.tier.duelists.flatMap((d) => [
        ...d.deck.main.map((e) => e.id), ...(d.deck.extra ?? []).map((e) => e.id),
        ...(['signatureCard', 'bondGift'] as const).flatMap((k) => (d[k] ? [d[k]!.id] : [])),
      ]),
      ...packs.flatMap((p) => p.cards.map((c) => c.id)),
    ];
    expect(ids.filter((id) => !playable(id))).toEqual([]);
  });

  it('os 4 pacotes de coleção do Tier 1 são as listas das caixas TCG', () => {
    for (const key of ['lob', 'mrd', 'mrl', 'psv']) {
      const pack = packs.find((p) => p.key === key)!;
      const box = boosters.find((b) => b.key === key)!;
      expect(pack.cards).toEqual(box.cards);
      expect(new Set(box.cards.map((c) => c.rarity))).toEqual(new Set(['common', 'rare', 'super', 'ultra']));
    }
  });

  it('toda carta dos boosters existe na base', () => {
    expect(boosters.flatMap((b) => b.cards).filter((c) => !playable(c.id))).toEqual([]);
  });
});
