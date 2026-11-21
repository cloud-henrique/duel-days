import { describe, expect, it } from 'vitest';
import { choosePick, epilogue, eventReview, needsAttention, openBondEvent, pendingPick, pickOf, bondEvent } from './bond';
import { BALANCE } from './balance';
import { newCampaign, type CampaignState } from './state';
import { migrate } from '../story/progress';

const base = (extra: Partial<CampaignState> = {}): CampaignState => ({ ...newCampaign(11), ...extra });
const goodOf = (key: string, n: number) => pickOf(bondEvent(key, n))!.options.findIndex((o) => o.tone === 'good');

describe('laços até o fim (change lacos-ate-o-fim)', () => {
  it('o 5º evento espera o Tier 2 e o 6º, o Tier 3', () => {
    const t1 = base({ day: 5, affinity: { joey: 500 }, victories: { joey: 5 }, bondEventsDone: { joey: 4 }, bondRoutes: { joey: 'friendship' } });
    expect(openBondEvent(t1, 'joey')).toBeNull();
    expect(openBondEvent({ ...t1, day: 8 }, 'joey')).toBe(5);
    const t2 = { ...t1, day: 10, affinity: { joey: 600 }, bondEventsDone: { joey: 5 } };
    expect(openBondEvent(t2, 'joey')).toBeNull();
    expect(openBondEvent({ ...t2, day: 15 }, 'joey')).toBe(6);
  });

  it('a escolha fica pendente depois do evento vencido, grava, dá a afinidade do tom e aparece no rever', () => {
    const s = base({ affinity: { tea: 100 }, victories: { tea: 1 }, bondEventsDone: { tea: 1 } });
    expect(pendingPick(s, 'tea')).toBe(1);
    expect(needsAttention(s, 'tea')).toBe(true);
    const i = goodOf('tea', 1);
    const r = choosePick(s, 'tea', i);
    expect(r.state.bondPicks?.tea?.[1]).toBe(i);
    expect(r.after - r.before).toBe(BALANCE.bondPickGood);
    expect(r.then).toEqual(pickOf(bondEvent('tea', 1))!.options[i].then);
    expect(pendingPick(r.state, 'tea')).toBeNull();
    expect(eventReview(r.state, 'tea', 1)!.slice(-r.then.length)).toEqual(r.then);
    expect(() => choosePick(r.state, 'tea', i)).toThrow();
  });

  it('o 3º evento não tem escolha de resposta (tem a de rota)', () => {
    const s = base({ bondEventsDone: { joey: 3 }, bondPicks: { joey: { 1: 0, 2: 0 } } });
    expect(pendingPick(s, 'joey')).toBeNull();
  });

  it('save de antes das escolhas: os eventos já vencidos não pedem resposta; o próximo pede', () => {
    const old = { ...base({ bondEventsDone: { bakura: 2 }, affinity: { bakura: 200 } }) } as CampaignState & Record<string, unknown>;
    delete old.bondPicks; delete old.bondPicksFrom;
    const p = migrate({ playerName: 'Ana', wins: {}, losses: {}, campaign: old })!;
    expect(p.campaign!.bondPicksFrom).toEqual({ bakura: 2 });
    expect(pendingPick(p.campaign!, 'bakura')).toBeNull();
    const later = { ...p.campaign!, bondEventsDone: { bakura: 4 }, bondRoutes: { bakura: 'romance' as const } };
    expect(pendingPick(later, 'bakura')).toBe(4);
  });

  it('o epílogo inclui as lembranças antes da última fala', () => {
    const n = 5, i = goodOf('joey', n);
    const remember = pickOf(bondEvent('joey', n))!.options[i].remember!;
    const s = base({ bondEventsDone: { joey: 6 }, bondRoutes: { joey: 'friendship' }, affinity: { joey: 600 }, bondPicks: { joey: { [n]: i } } });
    const e = epilogue(s)!;
    expect(e.scene.slice(-1 - remember.length, -1)).toEqual(remember);
    const plain = epilogue({ ...s, bondPicks: {} })!;
    expect(e.scene.length).toBe(plain.scene.length + remember.length);
    expect(e.scene.at(-1)).toEqual(plain.scene.at(-1));
  });
});
