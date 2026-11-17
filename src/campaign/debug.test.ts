import { describe, expect, it } from 'vitest';
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
    expect(present(pg).some((d) => d.key === 'pegasus')).toBe(true);
  });

  it('preset desconhecido não muda nada', () => {
    expect(debugPreset('nada', newCampaign(7))).toBeNull();
  });
});
