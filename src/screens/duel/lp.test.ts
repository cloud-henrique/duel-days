import { describe, expect, it } from 'vitest';
import { LP_STEPS, lpDelta, lpPercent, lpTone, lpTween } from './lp';

describe('lpTween', () => {
  it('começa no valor antigo e termina no novo', () => {
    expect(lpTween(8000, 7200, 0)).toBe(8000);
    expect(lpTween(8000, 7200, LP_STEPS)).toBe(7200);
  });
  it('passos intermediários (dano e cura)', () => {
    expect(lpTween(8000, 7200, LP_STEPS / 2)).toBe(7600);
    expect(lpTween(1000, 2000, LP_STEPS / 4)).toBe(1250);
  });
  it('passo fora do intervalo fica nos extremos', () => {
    expect(lpTween(8000, 0, -3)).toBe(8000);
    expect(lpTween(8000, 0, LP_STEPS + 5)).toBe(0);
  });
});

describe('lpTone', () => {
  it.each([[8000, 'high'], [4000, 'high'], [3999, 'mid'], [2000, 'mid'], [1999, 'low'], [0, 'low']] as const)('%i LP → %s', (lp, tone) => {
    expect(lpTone(lp)).toBe(tone);
  });
});

describe('lpPercent e lpDelta', () => {
  it('porcentagem limitada a 0..100', () => {
    expect(lpPercent(4000)).toBe(50);
    expect(lpPercent(-100)).toBe(0);
    expect(lpPercent(9000)).toBe(100);
  });
  it('sinal da variação', () => {
    expect(lpDelta(-800)).toBe('−800');
    expect(lpDelta(500)).toBe('+500');
  });
});
