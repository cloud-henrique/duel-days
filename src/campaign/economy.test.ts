import { describe, expect, it } from 'vitest';
import { LIMITED } from './balance';
import { PACKS } from './data/types';
import { present } from './map';
import {
  boxPrice, buy, buyBox, canBuy, characterListing, collectionListing, draw, missingDP, openUnopened, packByKey, price,
} from './packs';
import { applyDuel, drawCard, duelDP } from './rewards';
import { generator } from './rng';
import { newCampaign, type CampaignState, type Period } from './state';

const base = (extra: Partial<CampaignState> = {}): CampaignState => ({ ...newCampaign(21), ...extra });
function withPresent(key: string, s0: CampaignState): CampaignState {
  for (let day = s0.day; day <= 30; day++) for (const period of [0, 1, 2] as Period[]) {
    const s = { ...s0, day, period };
    if (present(s).some((d) => d.key === key)) return s;
  }
  throw new Error(`${key} nunca aparece`);
}

describe('DP do duelo', () => {
  it('vitória no turno 7 sem perder LP: 450 (teto de +50%)', () => {
    const r = duelDP({ result: 'win', turns: 7, lifePoints: 8000 });
    expect(r.total).toBe(450);
    expect(r.bonuses.map((b) => [b.kind, b.dp])).toEqual([['healthyFinish', 60], ['quickWin', 60], ['flawless', 30]]);
  });
  it('vitória longa com pouca vida: só a base', () => {
    expect(duelDP({ result: 'win', turns: 14, lifePoints: 1200 })).toEqual({ base: 300, bonuses: [], total: 300 });
  });
  it('derrota, empate e desistência: 60', () => {
    for (const result of ['lose', 'draw', 'forfeit'] as const) expect(duelDP({ result, turns: 3, lifePoints: 0 }).total).toBe(60);
  });
});

describe('cartas por vitória', () => {
  it('sem limitadas, preferindo as que não têm 3 cópias', () => {
    const deck = [55144522, 1, 1, 2];
    for (let i = 0; i < 50; i++) {
      const c = drawCard(deck, { 1: 3 }, generator(i));
      expect(c).toBe(2);
    }
    expect(LIMITED.has(55144522)).toBe(true);
  });

  it('a vitória paga DP, dá uma carta e soma a vitória; a 5ª dá a assinatura', () => {
    const s = withPresent('joey', base({ victories: { joey: 4 } }));
    const r = applyDuel(s, 'joey', 'regular', { result: 'win', turns: 12, lifePoints: 1500 });
    expect(r.reward.totalDP).toBe(300);
    expect(r.state.dp).toBe(300);
    expect(r.state.victories.joey).toBe(5);
    expect(r.reward.cards.map((c) => c.kind)).toEqual(['signature', 'drop']);
    expect(r.reward.cards[0].id).toBe(74677422); // Red-Eyes Black Dragon
    expect(r.state.period).toBe(((s.period + 1) % 3));
  });

  it('save antigo (assinatura na 10ª): entre a 6ª e a 10ª, sem a carta, ela sai na próxima vitória', () => {
    const s = withPresent('joey', base({ victories: { joey: 7 } }));
    const r = applyDuel(s, 'joey', 'regular', { result: 'win', turns: 12, lifePoints: 1500 });
    expect(r.reward.cards[0]).toMatchObject({ kind: 'signature', id: 74677422 });
    const again = applyDuel(withPresent('joey', r.state), 'joey', 'regular', { result: 'win', turns: 12, lifePoints: 1500 });
    expect(again.reward.cards.some((c) => c.kind === 'signature')).toBe(false);
  });

  it('a 5ª vitória libera o pacote de personagem', () => {
    const s = withPresent('tristan', base({ victories: { tristan: 4 } }));
    expect(applyDuel(s, 'tristan', 'regular', { result: 'win', turns: 12, lifePoints: 100 }).reward.unlockedPack).toBe('tristan');
  });

  it('primeira vitória contra o Yugi até o dia 7 dá um pacote da coleção mais recente', () => {
    const all = { tristan: 1, tea: 1, joey: 1, bakura: 1 };
    const s = { ...base({ victories: all }), day: 6 };
    const r = applyDuel(s, 'yugi', 'regular', { result: 'win', turns: 12, lifePoints: 100 });
    // No dia 6, a coleção mais recente à venda é o PSV (chega no dia 5).
    expect(r.reward).toMatchObject({ defeatedBossForFirstTime: true, prizePack: 'psv' });
    expect(r.state.unopenedPacks.at(-1)).toBe('psv');
    expect(r.state.concluded).toBe(false);
    const late = applyDuel({ ...s, day: 9 }, 'yugi', 'regular', { result: 'win', turns: 12, lifePoints: 100 });
    expect(late.reward.prizePack).toBeNull();
  });

  it('o duelo da noite do dia 30 encerra a campanha', () => {
    const last = base({ day: 30, period: 2 });
    const who = present(last)[0].key;
    const r = applyDuel(last, who, 'regular', { result: 'lose', turns: 5, lifePoints: 0 });
    expect(r.state.concluded).toBe(true);
    expect(r.reward.concluded).toBe(true);
  });
});

describe('loja', () => {
  it('preços e caixa (20 com 10%, para baixo na dezena)', () => {
    expect(price(packByKey('lob')!)).toBe(150);
    expect(price(packByKey('psv')!)).toBe(225);
    expect(price(packByKey('tea')!)).toBe(250);
    expect(boxPrice(packByKey('lob')!)).toBe(2700);
    expect(boxPrice(packByKey('psv')!)).toBe(4050);
  });

  it('no dia 2: LOB e MRD à venda, MRL "Dia 3", PSV "Dia 5" e o Tier 2 na vitrine; no dia 6, o PSV é novo', () => {
    const d2 = collectionListing(base({ day: 2 }));
    const tier2 = { kind: 'tier', tier: 2, boss: 'Yugi' };
    expect(d2.map((e) => [e.pack.key, e.lock])).toEqual([['lob', null], ['mrd', null], ['mrl', { kind: 'day', day: 3 }],
      ['psv', { kind: 'day', day: 5 }], ['lon', tier2], ['lod', tier2], ['pgd', tier2]]);
    const d6 = collectionListing(base({ day: 6 }));
    expect(d6.find((e) => e.pack.key === 'psv')).toMatchObject({ lock: null, isNew: true });
  });

  it('sem DP diz quanto falta e não compra', () => {
    const s = base({ dp: 120 });
    expect(canBuy(s, 'lob')).toBe(false);
    expect(missingDP(s, packByKey('lob')!)).toBe(30);
    expect(() => buy(s, 'lob')).toThrow();
  });

  it('pacote de personagem bloqueado mostra o progresso', () => {
    expect(characterListing(base({ victories: { tristan: 3 } }))[0].lock).toMatchObject({ kind: 'wins', wins: 3, goal: 5 });
  });

  it('comprar desconta o DP e põe 5 cartas na coleção; a caixa abre 20', () => {
    const s = base({ dp: 3000 });
    const r = buy(s, 'lob');
    expect(r.state.dp).toBe(2850);
    expect(r.opening.pulls).toHaveLength(5);
    expect(r.opening.pulls.filter((p) => p.rarity === 'common')).toHaveLength(4);
    const count = (c: Record<string, number>) => Object.values(c).reduce((a, b) => a + b, 0);
    expect(count(r.state.collection) - count(s.collection)).toBe(5);
    const box = buyBox(s, 'lob');
    expect(box.openings).toHaveLength(20);
    expect(box.state.dp).toBe(300);
  });

  it('abre os pacotes ganhos sem cobrar', () => {
    const r = openUnopened(base());
    expect(r.state.unopenedPacks).toHaveLength(2);
    expect(r.state.dp).toBe(0);
    expect(r.opening.packKey).toBe('lob');
  });

  it('a raridade do slot fica perto de 70/20/10 em 10.000 pacotes', () => {
    const lob = PACKS.find((p) => p.key === 'lob')!;
    const n = { rare: 0, super: 0, ultra: 0 } as Record<string, number>;
    for (let i = 0; i < 10000; i++) n[draw(lob, generator(99, i))[4].rarity]++;
    expect(n.rare / 100).toBeCloseTo(70, -1);
    expect(n.super / 100).toBeCloseTo(20, -1);
    expect(n.ultra / 100).toBeCloseTo(10, -1);
  });
});
