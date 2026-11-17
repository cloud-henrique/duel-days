// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { COIN_FRAMES, Coin, DIE_PIPS, Die, coinAngle, coinFrames } from './coin';

afterEach(cleanup);

describe('Coin', () => {
  it('duas faces: CARA e COROA', () => {
    const { container } = render(<Coin side="heads" spinMs={0} />);
    expect([...container.querySelectorAll('.coinlabel')].map((t) => t.textContent)).toEqual(['CARA', 'COROA']);
  });

  it('para no lado que caiu: meia volta a mais na coroa', () => {
    expect(coinAngle('heads') % 360).toBe(0);
    expect(coinAngle('tails') % 360).toBe(180);
  });

  it('com "reduzir movimento" já aparece parada no lado certo', () => {
    const { container } = render(<Coin side="tails" spinMs={900} reduced />);
    expect((container.querySelector('.coinspin') as HTMLElement).style.transform).toBe('rotateY(180deg)');
    expect(container.querySelector('[aria-label="Coroa"]')).toBeTruthy();
  });
});

describe('Die', () => {
  it.each([1, 2, 3, 4, 5, 6])('%i pontos', (n) => {
    const { container } = render(<Die value={n} spinMs={0} />);
    expect(container.querySelectorAll('.diepip')).toHaveLength(n);
    expect(DIE_PIPS[n]).toHaveLength(n);
  });
});

describe('coinFrames (sprite)', () => {
  it('começa na cara, alterna as faces a cada meia volta e para no lado que caiu', () => {
    const h = coinFrames('heads', 1), t = coinFrames('tails', 1);
    expect(h[0]).toBe(COIN_FRAMES.heads);
    expect(h.at(-1)).toBe(COIN_FRAMES.heads);
    expect(t.at(-1)).toBe(COIN_FRAMES.tails);
    expect(h).toEqual([0, 12, 14, 16, 6, 13, 14, 15, 0]);
    expect(Math.max(...t)).toBeLessThan(COIN_FRAMES.count);
  });
});
