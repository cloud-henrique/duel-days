import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { CardRecord } from '../../engine/session';
import { validateDeck } from '../../game/decks';
import { expand } from '../decks';
import { CAMPAIGN, DIALOGUE, DUELISTS, PACKS, TIERS } from './types';

const CARDS = 'public/data/cards.json';

/** Todo id que a campanha usa: deck inicial, decks dos oponentes, assinaturas, cartas do laço e pacotes. */
function campaignIds(): Set<number> {
  const ids = new Set<number>();
  CAMPAIGN.starterDeck.main.forEach((e) => ids.add(e.id));
  for (const d of DUELISTS) {
    [...d.deck.main, ...d.deck.extra].forEach((e) => ids.add(e.id));
    ids.add(d.signatureCard.id);
    if (d.bondGift) ids.add(d.bondGift.id);
  }
  PACKS.forEach((p) => p.cards.forEach((c) => ids.add(c.id)));
  return ids;
}

describe('dados da campanha', () => {
  it('Tier 1 com os 5 do nativo, com laço e o diálogo de cada um', () => {
    expect(TIERS[0].duelists.map((d) => d.key)).toEqual(['tristan', 'tea', 'joey', 'bakura', 'yugi']);
    for (const d of TIERS[0].duelists) {
      expect(d.bond).toBe(true);
      expect(DIALOGUE.duelists[d.key]?.bondEvents).toHaveLength(4);
    }
  });

  it('Tier 2: 5 comuns e o Pegasus de chefe, sem laço, com falas e cena', () => {
    const t2 = TIERS[1];
    expect(t2).toMatchObject({ number: 2, name: 'Reino dos Duelistas', firstDay: 8, lastDay: 14 });
    expect(t2.duelists.filter((d) => !d.isBoss).map((d) => d.key)).toEqual(['weevil', 'rex', 'mako', 'keith', 'mai']);
    expect(t2.duelists.find((d) => d.isBoss)?.key).toBe('pegasus');
    for (const d of t2.duelists) {
      expect(d.bond, d.key).toBe(false);
      expect(d.bondGift, d.key).toBeUndefined();
      expect(d.scene.bg && d.scene.place, d.key).toBeTruthy();
      expect(DIALOGUE.duelists[d.key]?.greeting.length, d.key).toBeGreaterThan(0);
    }
    expect(DIALOGUE.duelists.pegasus.bossEntrance?.length).toBeGreaterThan(0);
    expect(DIALOGUE.duelists.pegasus.bossDefeat?.length).toBeGreaterThan(0);
  });

  it('janelas dos tiers: 1–7, 8–14, 15–22, 23–30', () => {
    expect(TIERS.map((t) => [t.firstDay, t.lastDay])).toEqual([[1, 7], [8, 14], [15, 22], [23, 30]]);
  });

  it('pontos do mapa suficientes para todo mundo de um período', () => {
    // 4 comuns + 2 amigos + 2 chefes.
    expect(CAMPAIGN.mapPoints.length).toBeGreaterThanOrEqual(8);
    expect(new Set(CAMPAIGN.mapPoints.map((p) => `${p.x},${p.y}`)).size).toBe(CAMPAIGN.mapPoints.length);
  });

  it('o deck inicial tem 40 cartas', () => {
    expect(CAMPAIGN.starterDeck.main.reduce((s, e) => s + e.count, 0)).toBe(40);
  });

  it.skipIf(!existsSync(CARDS))('toda carta da campanha está no cards.json exportado', () => {
    const cards = JSON.parse(readFileSync(CARDS, 'utf8')) as Record<string, unknown>;
    const missing = [...campaignIds()].filter((id) => !cards[String(id)]);
    expect(missing).toEqual([]);
  });

  it.skipIf(!existsSync('public/campaign'))('a cena de cada duelista tem o fundo copiado (copy_tfs_backgrounds.py)', () => {
    const missing = DUELISTS.filter((d) => !existsSync(`public/campaign/bg-${d.scene.bg}.jpg`)).map((d) => d.key);
    expect(missing).toEqual([]);
  });

  it('nenhuma fala fora dos eventos de laço entrega uma carta (a assinatura só chega na 5ª vitória)', () => {
    // O presente do laço é dado no 4º evento, onde a fala de entrega está certa; nos outros momentos, não.
    const gives = /\b(fica|fique|toma|tome|leva|leve|pega|pegue|aceita|aceite)\b( com)? (o|a) (meu|minha)\b/i;
    const bad: string[] = [];
    for (const [key, moments] of Object.entries(DIALOGUE.duelists)) {
      for (const [moment, scenes] of Object.entries(moments as unknown as Record<string, unknown>)) {
        if (moment === 'bondEvents') continue;
        for (const text of JSON.stringify(scenes).match(/"text":"(?:[^"\\]|\\.)*"/g) ?? []) {
          if (gives.test(text)) bad.push(`${key}.${moment}: ${text}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('a carta-assinatura de cada duelista está no deck dele', () => {
    for (const d of DUELISTS) {
      expect([...d.deck.main, ...d.deck.extra].some((e) => e.id === d.signatureCard.id), d.key).toBe(true);
    }
  });

  it.skipIf(!existsSync(CARDS))('o deck de cada duelista é válido', () => {
    const cards = JSON.parse(readFileSync(CARDS, 'utf8')) as Record<string, CardRecord>;
    for (const d of DUELISTS) {
      expect(validateDeck({ main: expand(d.deck.main), extra: expand(d.deck.extra) }, cards), d.key).toEqual([]);
    }
  });
});
