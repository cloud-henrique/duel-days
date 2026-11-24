import { describe, expect, it } from 'vitest';
import { championScene } from './bond';
import { debugPreset } from './debug';
import { present } from './map';
import { newCampaign } from './state';
import { currentTier } from './tiers';

describe('debugPreset', () => {
  it('all-cards: 3 cópias de cada carta da base, sem mexer no resto', () => {
    const s0 = newCampaign(7);
    const s = debugPreset('all-cards', s0, [10, 20, 30])!;
    expect(s.collection['10']).toBe(3);
    expect(s.collection['30']).toBe(3);
    expect(s.day).toBe(s0.day);
    expect(s0.collection['10']).toBeUndefined();
  });

  it('tier2 e pegasus: Tier 2 aberto; no pegasus, o chefe no mapa', () => {
    const t2 = debugPreset('tier2', newCampaign(7))!;
    expect(currentTier(t2).number).toBe(2);
    const pg = debugPreset('pegasus', newCampaign(7))!;
    expect(currentTier(pg).number).toBe(2);
    expect(present(pg).some(d => d.key === 'pegasus')).toBe(true);
  });

  it('tier4, yamimarik e final (change tier4-finais): o Tier 4 aberto; o chefe; o duelo final e a cena do Joey', () => {
    const t4 = debugPreset('tier4', newCampaign(7))!;
    expect(currentTier(t4).number).toBe(4);
    expect(t4.dp).toBe(3000);
    const ym = debugPreset('yamimarik', newCampaign(7))!;
    expect(present(ym).some(d => d.key === 'yamimarik')).toBe(true);
    expect(present(ym).some(d => d.key === 'yamiyugi')).toBe(false);
    const fin = debugPreset('final', newCampaign(7))!;
    expect(currentTier(fin).number).toBe(4);
    expect(present(fin).some(d => d.key === 'yamiyugi')).toBe(true);
    expect(championScene(fin)).toBe('joey');
    expect(fin.champion).toBeUndefined();
  });

  it('preset desconhecido não muda nada', () => {
    expect(debugPreset('nada', newCampaign(7))).toBeNull();
  });
});
