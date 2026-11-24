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
  CAMPAIGN.starterDeck.main.forEach(e => ids.add(e.id));
  for (const d of DUELISTS) {
    [...d.deck.main, ...d.deck.extra].forEach(e => ids.add(e.id));
    ids.add(d.signatureCard.id);
    if (d.bondGift) ids.add(d.bondGift.id);
  }
  PACKS.forEach(p => p.cards.forEach(c => ids.add(c.id)));
  return ids;
}

describe('dados da campanha', () => {
  it('Tier 1 com os 5 do nativo, com laço e o diálogo de cada um', () => {
    expect(TIERS[0].duelists.map(d => d.key)).toEqual(['tristan', 'tea', 'joey', 'bakura', 'yugi']);
    for (const d of TIERS[0].duelists) {
      expect(d.bond).toBe(true);
      expect(DIALOGUE.duelists[d.key]?.bondEvents).toHaveLength(6);
    }
  });

  it('laços até o fim (change lacos-ate-o-fim): 6º com as duas rotas, escolha em todos menos o 3º, alguma lembrança', () => {
    for (const d of TIERS[0].duelists) {
      const evs = DIALOGUE.duelists[d.key].bondEvents!;
      expect('friendship' in evs[5] && 'romance' in evs[5], `${d.key} 6º`).toBe(true);
      let remembers = 0;
      evs.forEach((ev, i) => {
        const pick = 'pick' in ev ? ev.pick : undefined;
        if (i === 2) {
          expect(pick, `${d.key} 3º sem escolha`).toBeUndefined();
          return;
        }
        expect(pick, `${d.key} evento ${i + 1}`).toBeTruthy();
        expect(pick!.options.length).toBeGreaterThanOrEqual(2);
        expect(pick!.options.length).toBeLessThanOrEqual(3);
        for (const o of pick!.options) {
          expect(['good', 'neutral', 'bad']).toContain(o.tone);
          expect(o.label.length && o.then.length, `${d.key} evento ${i + 1}: ${o.label}`).toBeTruthy();
          if (o.remember?.length) remembers++;
        }
        expect(pick!.options.map(o => o.tone)).toContain('good');
      });
      expect(remembers, `${d.key} lembranças`).toBeGreaterThanOrEqual(1);
    }
  });

  it('Tier 2: 5 comuns e o Pegasus de chefe, sem laço, com falas e cena', () => {
    const t2 = TIERS[1];
    expect(t2).toMatchObject({ number: 2, name: 'Reino dos Duelistas', firstDay: 8, lastDay: 14 });
    expect(t2.duelists.filter(d => !d.isBoss).map(d => d.key)).toEqual(['weevil', 'rex', 'mako', 'keith', 'mai']);
    expect(t2.duelists.find(d => d.isBoss)?.key).toBe('pegasus');
    for (const d of t2.duelists) {
      expect(d.bond, d.key).toBe(false);
      expect(d.bondGift, d.key).toBeUndefined();
      expect(d.scene.bg && d.scene.place, d.key).toBeTruthy();
      expect(DIALOGUE.duelists[d.key]?.greeting.length, d.key).toBeGreaterThan(0);
    }
    expect(DIALOGUE.duelists.pegasus.bossEntrance?.length).toBeGreaterThan(0);
    expect(DIALOGUE.duelists.pegasus.bossDefeat?.length).toBeGreaterThan(0);
  });

  it('Tier 4 (change tier4-finais): 4 comuns, Yami Marik de chefe e o Yami Yugi como o único duelo final', () => {
    const t4 = TIERS[3];
    expect(t4).toMatchObject({ number: 4, name: 'Finais', firstDay: 23, lastDay: 30 });
    expect(t4.packs).toEqual([
      { key: 'ast', offset: 0 },
      { key: 'sod', offset: 2 },
    ]);
    expect(t4.duelists.filter(d => !d.isBoss && !d.isFinal).map(d => d.key)).toEqual([
      'ishizu',
      'odion',
      'yamibakura',
      'marik',
    ]);
    expect(t4.duelists.find(d => d.isBoss)?.key).toBe('yamimarik');
    expect(DUELISTS.filter(d => d.isFinal).map(d => d.key)).toEqual(['yamiyugi']);
    const sig = Object.fromEntries(t4.duelists.map(d => [d.key, d.signatureCard.id]));
    expect(sig).toEqual({
      ishizu: 17484499,
      odion: 28649820,
      yamibakura: 31829185,
      marik: 10000000,
      yamimarik: 10000010,
      yamiyugi: 10000020,
    });
    for (const d of t4.duelists) {
      expect(d.bond, d.key).toBe(false);
      expect(d.scene.bg && d.scene.place, d.key).toBeTruthy();
    }
  });

  it('falas do Tier 4: todo momento com variações, entrada e derrota dos dois chefes e as 6 cenas de campeão', () => {
    for (const d of TIERS[3].duelists) {
      const dl = DIALOGUE.duelists[d.key];
      for (const m of ['firstGreeting', 'greeting', 'beforeDuel', 'playerWins', 'playerLoses'] as const) {
        expect(dl[m]?.length, `${d.key}.${m}`).toBeGreaterThan(0);
        expect(dl[m]!.length, `${d.key}.${m}`).toBeLessThanOrEqual(3);
      }
      expect(dl.firstWin.length, d.key).toBeGreaterThan(0);
      if (d.isBoss || d.isFinal) {
        expect(dl.bossEntrance?.length, d.key).toBeGreaterThan(0);
        expect(dl.bossDefeat?.length, d.key).toBeGreaterThan(0);
      }
    }
    expect(Object.keys(DIALOGUE.champion ?? {}).sort()).toEqual([
      'bakura',
      'generic',
      'joey',
      'tea',
      'tristan',
      'yugi',
    ]);
    for (const [k, scene] of Object.entries(DIALOGUE.champion!)) expect(scene.length, k).toBeGreaterThan(0);
  });

  it('marcação das falas: {nome} ou {masculino|feminino|neutro}, nunca outra coisa', () => {
    const bad: string[] = [];
    for (const text of JSON.stringify(DIALOGUE).match(/"text":"(?:[^"\\]|\\.)*"/g) ?? []) {
      for (const [, inner] of text.matchAll(/\{([^{}]*)\}/g))
        if (inner !== 'nome' && inner.split('|').length !== 3) bad.push(text);
    }
    expect(bad).toEqual([]);
  });

  it('só o duelo final fala do Slifer na vitória (ele o entrega na 1ª)', () => {
    const mentions = Object.entries(DIALOGUE.duelists)
      .filter(([, dl]) => /Slifer/.test(JSON.stringify([dl.playerWins, dl.firstWin, dl.bossDefeat])))
      .map(([k]) => k);
    expect(mentions).toEqual(['yamiyugi']);
  });

  it('janelas dos tiers: 1–7, 8–14, 15–22, 23–30', () => {
    expect(TIERS.map(t => [t.firstDay, t.lastDay])).toEqual([
      [1, 7],
      [8, 14],
      [15, 22],
      [23, 30],
    ]);
  });

  it('pontos do mapa suficientes para todo mundo de um período', () => {
    // 4 comuns + 2 amigos + 2 chefes.
    expect(CAMPAIGN.mapPoints.length).toBeGreaterThanOrEqual(8);
    expect(new Set(CAMPAIGN.mapPoints.map(p => `${p.x},${p.y}`)).size).toBe(CAMPAIGN.mapPoints.length);
  });

  it('o deck inicial tem 40 cartas', () => {
    expect(CAMPAIGN.starterDeck.main.reduce((s, e) => s + e.count, 0)).toBe(40);
  });

  it.skipIf(!existsSync(CARDS))('toda carta da campanha está no cards.json exportado', () => {
    const cards = JSON.parse(readFileSync(CARDS, 'utf8')) as Record<string, unknown>;
    const missing = [...campaignIds()].filter(id => !cards[String(id)]);
    expect(missing).toEqual([]);
  });

  it.skipIf(!existsSync('public/campaign'))(
    'a cena de cada duelista tem o fundo copiado (copy_tfs_backgrounds.py)',
    () => {
      const missing = DUELISTS.filter(d => !existsSync(`public/campaign/bg-${d.scene.bg}.jpg`)).map(d => d.key);
      expect(missing).toEqual([]);
    },
  );

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
      expect(
        [...d.deck.main, ...d.deck.extra].some(e => e.id === d.signatureCard.id),
        d.key,
      ).toBe(true);
    }
  });

  it.skipIf(!existsSync(CARDS))('o deck de cada duelista é válido', () => {
    const cards = JSON.parse(readFileSync(CARDS, 'utf8')) as Record<string, CardRecord>;
    for (const d of DUELISTS) {
      expect(validateDeck({ main: expand(d.deck.main), extra: expand(d.deck.extra) }, cards), d.key).toEqual([]);
    }
  });
});
