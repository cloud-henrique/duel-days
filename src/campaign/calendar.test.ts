import { describe, expect, it } from 'vitest';
import { advancePeriod, daysLeft } from './calendar';
import { BOSS, REGULARS, isBossAvailable, present, tierProgress } from './map';
import { generator, mix, shuffle } from './rng';
import { clone, newCampaign, type CampaignState, type Period } from './state';

const at = (day: number, period: Period, extra: Partial<CampaignState> = {}): CampaignState =>
  ({ ...newCampaign(42), day, period, ...extra });

describe('semente', () => {
  it('a mesma entrada dá o mesmo resultado, e entradas diferentes divergem', () => {
    expect(mix(1, 2, 3)).toBe(mix(1, 2, 3));
    expect(mix(1, 2, 3)).not.toBe(mix(1, 2, 4));
    const a = generator(5, 9), b = generator(5, 9);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(shuffle([1, 2, 3, 4, 5], generator(1))).toEqual(shuffle([1, 2, 3, 4, 5], generator(1)));
  });
});

describe('campanha nova', () => {
  it('começa no dia 1 de manhã, 0 DP, deck inicial de 40 ativo e 3 LOB fechados', () => {
    const s = newCampaign(7);
    expect([s.day, s.period, s.dp]).toEqual([1, 0, 0]);
    expect(s.decks[0].main).toHaveLength(40);
    expect(Object.values(s.collection).reduce((a, b) => a + b, 0)).toBe(40);
    expect(s.unopenedPacks).toEqual(['lob', 'lob', 'lob']);
  });
});

describe('calendário', () => {
  it('manhã → tarde → noite → manhã do dia seguinte', () => {
    const s = at(3, 0);
    advancePeriod(s); expect([s.day, s.period]).toEqual([3, 1]);
    advancePeriod(s); expect([s.day, s.period]).toEqual([3, 2]);
    advancePeriod(s); expect([s.day, s.period]).toEqual([4, 0]);
  });

  it('depois da noite do dia 30, a campanha termina e o mapa fica vazio', () => {
    const s = at(30, 2);
    advancePeriod(s);
    expect(s.concluded).toBe(true);
    expect(present(s)).toEqual([]);
  });

  it('dias restantes contam o dia de hoje', () => {
    expect(daysLeft(at(10, 0))).toBe(21);
  });
});

describe('mapa', () => {
  it('de 2 a 4 comuns por período, sempre os mesmos para o mesmo dia e período', () => {
    for (let day = 1; day <= 30; day++) for (const p of [0, 1, 2] as Period[]) {
      const here = present(at(day, p));
      expect(here.length).toBeGreaterThanOrEqual(2);
      expect(here.length).toBeLessThanOrEqual(4);
      expect(here.map((d) => d.key)).toEqual(present(at(day, p)).map((d) => d.key));
    }
  });

  it('o sorteio varia entre períodos', () => {
    const sets = new Set<string>();
    for (let day = 1; day <= 10; day++) for (const p of [0, 1, 2] as Period[]) sets.add(present(at(day, p)).map((d) => d.key).join());
    expect(sets.size).toBeGreaterThan(3);
  });

  it('o chefe só aparece depois de vencer os 4 comuns, e então em todo período', () => {
    const s = at(5, 1);
    expect(isBossAvailable(s)).toBe(false);
    const three = clone(s);
    for (const d of REGULARS.slice(0, 3)) three.victories[d.key] = 1;
    expect(present(three).some((d) => d.isBoss)).toBe(false);
    expect(tierProgress(three).boss).toMatch(/vença todos/);
    const all = clone(three);
    all.victories[REGULARS[3].key] = 2;
    expect(present(all).at(-1)?.key).toBe(BOSS?.key);
    expect(tierProgress(all)).toMatchObject({ beaten: 4, boss: `${BOSS?.name} está esperando!` });
  });
});
