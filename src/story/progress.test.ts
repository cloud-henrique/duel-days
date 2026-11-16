import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, withDefaults, type Settings } from './progress';

describe('withDefaults', () => {
  it('save antigo, sem settings: animações normais e som ligado', () => {
    expect(withDefaults(undefined)).toEqual({ anim: 'normal', sound: true });
    expect(withDefaults(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('parcial: completa só o que falta', () => {
    expect(withDefaults({ anim: 'fast' })).toEqual({ anim: 'fast', sound: true });
    expect(withDefaults({ sound: false })).toEqual({ anim: 'normal', sound: false });
  });

  it('completo: mantém', () => {
    expect(withDefaults({ anim: 'off', sound: false })).toEqual({ anim: 'off', sound: false });
  });

  it('valores estranhos voltam ao padrão', () => {
    expect(withDefaults({ anim: 'turbo', sound: 'sim' } as unknown as Partial<Settings>)).toEqual(DEFAULT_SETTINGS);
  });
});
