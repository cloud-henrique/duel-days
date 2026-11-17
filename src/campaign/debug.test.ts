import { describe, expect, it } from 'vitest';
import { debugPreset } from './debug';
import { newCampaign } from './state';

describe('debugPreset', () => {
  it('all-cards: 3 cópias de cada carta da base, sem mexer no resto', () => {
    const s0 = newCampaign(7);
    const s = debugPreset('all-cards', s0, [10, 20, 30])!;
    expect(s.collection['10']).toBe(3);
    expect(s.collection['30']).toBe(3);
    expect(s.day).toBe(s0.day);
    expect(s0.collection['10']).toBeUndefined();
  });

  it('preset desconhecido não muda nada', () => {
    expect(debugPreset('nada', newCampaign(7))).toBeNull();
  });
});
