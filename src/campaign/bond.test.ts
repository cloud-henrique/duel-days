import { describe, expect, it } from 'vitest';
import {
  addAffinity, bondChoiceScene, canTalk, chooseRoute, dislikedTopic, epilogue, eventReview, isChoicePending,
  needsAttention, openBondEvent, playableEvent, talk, TOPICS,
} from './bond';
import { DIALOGUE } from './data/types';
import { present } from './map';
import { applyDuel } from './rewards';
import { clone, newCampaign, type CampaignState, type Period } from './state';

const base = (extra: Partial<CampaignState> = {}): CampaignState => ({ ...newCampaign(11), ...extra });

/** Um período em que o duelista está no mapa. */
function withPresent(key: string, s0: CampaignState): CampaignState {
  for (let day = s0.day; day <= 30; day++) for (const period of [0, 1, 2] as Period[]) {
    const s = { ...s0, day, period };
    if (present(s).some((d) => d.key === key)) return s;
  }
  throw new Error(`${key} nunca aparece`);
}

describe('afinidade', () => {
  it('tem teto no fim do coração do próximo evento', () => {
    const s = base({ affinity: { tristan: 95 } });
    expect(addAffinity(s, 'tristan', 30)).toEqual({ before: 95, after: 100 });
  });

  it('tem piso no começo do coração atual', () => {
    const s = base({ affinity: { joey: 105 }, bondEventsDone: { joey: 1 } });
    expect(addAffinity(s, 'joey', -15)).toEqual({ before: 105, after: 100 });
  });

  it('vitória comum dá +30, derrota +10, desistência 0, e o duelo do evento não mexe', () => {
    const s = withPresent('tea', base({ victories: { tea: 1 }, affinity: { tea: 10 } }));
    expect(applyDuel(s, 'tea', 'regular', { result: 'win', turns: 20, lifePoints: 100 }).state.affinity.tea).toBe(40);
    expect(applyDuel(s, 'tea', 'regular', { result: 'lose', turns: 20, lifePoints: 0 }).state.affinity.tea).toBe(20);
    expect(applyDuel(s, 'tea', 'regular', { result: 'forfeit', turns: 2, lifePoints: 8000 }).state.affinity.tea).toBe(10);
  });
});

describe('conversa', () => {
  it('tema que agrada +20, tema ruim −15 (com piso), Boatos +5; uma por dia', () => {
    const s = withPresent('joey', base({ affinity: { joey: 50 } }));
    const bad = dislikedTopic(s, 'joey');
    expect(bad).not.toBe('rumors');
    const good = TOPICS.find((t) => t !== bad && t !== 'rumors')!;
    expect(talk(s, 'joey', good).result).toMatchObject({ liked: true, before: 50, after: 70 });
    expect(talk(s, 'joey', bad).result).toMatchObject({ liked: false, after: 35 });
    const r = talk(s, 'joey', 'rumors');
    expect(r.result.after).toBe(55);
    expect(canTalk(r.state, 'joey')).toBe(false);
    expect(() => talk(r.state, 'joey', 'rumors')).toThrow();
  });

  it('a cena da conversa é a do gosto ou desgosto', () => {
    expect(DIALOGUE.duelists.tea.conversation!.duels.liked.length).toBeGreaterThan(0);
  });
});

describe('eventos de laço', () => {
  it('o 1º abre com 100 de afinidade e uma vitória; o 4º só depois da escolha', () => {
    expect(openBondEvent(base({ affinity: { tea: 100 } }), 'tea')).toBeNull();
    expect(openBondEvent(base({ affinity: { tea: 100 }, victories: { tea: 1 } }), 'tea')).toBe(1);
    const choice = base({ affinity: { tea: 400 }, victories: { tea: 5 }, bondEventsDone: { tea: 3 } });
    expect(isChoicePending(choice, 'tea')).toBe(true);
    expect(openBondEvent(choice, 'tea')).toBeNull();
    expect(needsAttention(choice, 'tea')).toBe(true);
    expect(bondChoiceScene(choice, 'tea')?.length).toBeGreaterThan(0);
    const chosen = chooseRoute(choice, 'tea', 'romance');
    expect(chosen.then.length).toBeGreaterThan(0);
    expect(openBondEvent(chosen.state, 'tea')).toBe(4);
  });

  it('vencer o evento fecha e marca; perder deixa aberto e some até amanhã', () => {
    const s = withPresent('joey', base({ affinity: { joey: 200 }, victories: { joey: 3 }, bondEventsDone: { joey: 1 } }));
    expect(openBondEvent(s, 'joey')).toBe(2);
    const won = applyDuel(s, 'joey', 'bondEvent', { result: 'win', turns: 20, lifePoints: 100 });
    expect(won.state.bondEventsDone.joey).toBe(2);
    expect(won.reward.bond).toMatchObject({ completedEvent: 2, before: 200, after: 200 });
    const lost = applyDuel(s, 'joey', 'bondEvent', { result: 'lose', turns: 20, lifePoints: 0 });
    expect(lost.state.bondEventsDone.joey).toBe(1);
    const sameDay = { ...lost.state, day: s.day };
    expect(openBondEvent(sameDay, 'joey')).toBe(2);
    expect(playableEvent(sameDay, 'joey')).toBeNull();
    expect(playableEvent({ ...sameDay, day: s.day + 1 }, 'joey')).toBe(2);
  });

  it('vencer o 4º evento dá a carta do laço', () => {
    const s = withPresent('joey', base({ affinity: { joey: 400 }, victories: { joey: 9 }, bondEventsDone: { joey: 3 }, bondRoutes: { joey: 'friendship' } }));
    const r = applyDuel(s, 'joey', 'bondEvent', { result: 'win', turns: 20, lifePoints: 100 });
    const FLAME_SWORDSMAN = 45231177;
    expect(r.reward.cards.find((c) => c.kind === 'bondGift')?.id).toBe(FLAME_SWORDSMAN);
    // A carta sorteada da vitória também pode ser um Flame Swordsman (está no deck do Joey).
    const earned = r.reward.cards.filter((c) => c.id === FLAME_SWORDSMAN).length;
    expect(r.state.collection[FLAME_SWORDSMAN]).toBe((s.collection[FLAME_SWORDSMAN] ?? 0) + earned);
  });

  it('rever um evento vencido não muda o save', () => {
    const s = base({ bondEventsDone: { tristan: 1 } });
    const copy = clone(s);
    expect(eventReview(s, 'tristan', 1)?.length).toBeGreaterThan(0);
    expect(eventReview(s, 'tristan', 2)).toBeNull();
    expect(s).toEqual(copy);
  });
});

describe('epílogo', () => {
  it('quem tem mais eventos vencidos; romance só se foi a rota escolhida', () => {
    const s = base({ bondEventsDone: { tea: 4, joey: 2 }, bondRoutes: { tea: 'romance' }, affinity: { tea: 400, joey: 200 } });
    expect(epilogue(s)).toMatchObject({ duelist: { key: 'tea' }, route: 'romance' });
    expect(epilogue(base({ bondEventsDone: { joey: 2, bakura: 2 }, affinity: { joey: 200, bakura: 260 } }))?.duelist.key).toBe('bakura');
    expect(epilogue(base())).toBeNull();
  });
});
