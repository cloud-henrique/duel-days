import { describe, expect, it } from 'vitest';
import { packByKey, packCards, packRulesText, packStats } from './packs';
import { SHOPKEEPER, shopLine } from './shopkeeper';
import { newCampaign } from './state';

describe('detalhe do pacote', () => {
  const lob = packByKey('lob')!;
  it('conta as raridades e as cartas diferentes que o jogador tem', () => {
    const ids = packCards(lob).map((c) => c.id);
    const s = { ...newCampaign(3), collection: Object.fromEntries(ids.slice(0, 14).map((id) => [String(id), 1])) };
    const st = packStats(s, lob);
    expect(st.total).toBe(ids.length);
    expect(st.owned).toBe(14);
    expect(st.byRarity.ultra + st.byRarity.super + st.byRarity.rare + st.byRarity.common).toBe(lob.cards.length);
  });
  it('a grade vai da Ultra à Comum, sem repetir carta', () => {
    const cards = packCards(lob);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    expect(cards[0].rarity).toBe('ultra');
    expect(cards[cards.length - 1].rarity).toBe('common');
  });
  it('a ajuda traz as chances do slot', () => {
    expect(packRulesText().join(' ')).toContain('70% Rara, 20% Super Rara, 10% Ultra Rara');
  });
});

describe('falas do vovô', () => {
  const who = { name: 'Ana', address: 'she' as const };
  it('mesma semente e contador, mesma fala', () => {
    expect(shopLine('welcome', 9, 0, who)).toEqual(shopLine('welcome', 9, 0, who));
  });
  it('resolve o nome e o tratamento', () => {
    for (let n = 0; n < 20; n++) {
      const l = shopLine('welcome', 9, n, who);
      expect(l.text).not.toMatch(/[{}]/);
      expect(SHOPKEEPER.welcome.some((w) => w.expression === l.expression)).toBe(true);
    }
    expect(Array.from({ length: 30 }, (_, n) => shopLine('welcome', 1, n, who).text).some((t) => t.includes('Ana'))).toBe(true);
  });
  it('varia com o contador', () => {
    expect(new Set(Array.from({ length: 30 }, (_, n) => shopLine('boughtPack', 5, n, who).text)).size).toBeGreaterThan(1);
  });
});
