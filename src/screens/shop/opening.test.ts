import { describe, expect, it } from 'vitest';
import type { PackOpening, Pull } from '../../campaign/packs';
import { allFlipped, flip, newCount, next, revealAll, skipAll, startOpening, summaryOrder, tear } from './opening';

const pull = (id: number, rarity: Pull['rarity'] = 'common', isNew = false): Pull => ({ id, rarity, isNew });
const pack = (...pulls: Pull[]): PackOpening => ({ packKey: 'lob', pulls });
const one = [pack(pull(1, 'common', true), pull(2), pull(3), pull(4, 'common', true), pull(5, 'super', true))];

describe('um pacote', () => {
  it('rasga, vira uma, revela o resto e termina', () => {
    let s = startOpening(one);
    expect(flip(s, one, 0).state).toBe(s); // fechado: não vira
    const t = tear(s); expect(t.sounds).toEqual(['tear']); s = t.state;
    const f = flip(s, one, 0); expect(f.sounds).toEqual(['flip']); s = f.state;
    expect(flip(s, one, 0).sounds).toEqual([]); // já virada
    const r = revealAll(s, one); expect(r.sounds).toEqual(['flip', 'rare']); s = r.state;
    expect(allFlipped(s)).toBe(true);
    expect(next(s, one).state.phase).toBe('summary');
  });
  it('a Super toca a rara ao virar', () => {
    const s = tear(startOpening(one)).state;
    expect(flip(s, one, 4).sounds).toEqual(['flip', 'rare']);
  });
  it('conta as novas', () => { expect(newCount(one)).toBe(3); });
});

describe('caixa', () => {
  const box = Array.from({ length: 20 }, (_, k) => pack(pull(k * 10 + 1), pull(k * 10 + 2), pull(k * 10 + 3), pull(k * 10 + 4),
    pull(k * 10 + 5, k === 7 ? 'ultra' : 'rare', k === 7)));
  it('pacote a pacote', () => {
    let s = startOpening(box);
    s = revealAll(tear(s).state, box).state;
    s = next(s, box).state;
    expect(s).toMatchObject({ index: 1, phase: 'sealed' });
  });
  it('"Abrir todos" toca a rara se ainda faltava Ultra', () => {
    expect(skipAll(startOpening(box), box).sounds).toEqual(['rare']);
    let s = startOpening(box);
    for (let k = 0; k < 8; k++) s = next(revealAll(tear(s).state, box).state, box).state;
    expect(s.index).toBe(8);
    expect(skipAll(s, box)).toMatchObject({ sounds: [], state: { phase: 'summary' } });
  });
  it('resumo da Ultra para a Comum', () => {
    const order = summaryOrder(box);
    expect(order).toHaveLength(100);
    expect(order[0]).toMatchObject({ id: 75, rarity: 'ultra' });
    expect(order.slice(1, 20).every((p) => p.rarity === 'rare')).toBe(true);
    expect(order[20].rarity).toBe('common');
  });
  it('carta repetida conta uma vez nas novas', () => {
    expect(newCount([pack(pull(1, 'common', true)), pack(pull(1, 'common', true))])).toBe(1);
  });
});
