// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Coin, DIE_PIPS, Die, coinAngle } from './coin';

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
