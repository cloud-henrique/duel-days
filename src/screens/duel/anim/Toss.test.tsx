// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Toss, tossCaption } from './Toss';

afterEach(cleanup);

describe('Toss', () => {
  it('legenda: Cara/Coroa na moeda, o número no dado', () => {
    expect(tossCaption({ what: 'coin', results: [1] })).toBe('Cara');
    expect(tossCaption({ what: 'coin', results: [0, 1] })).toBe('Coroa · Cara');
    expect(tossCaption({ what: 'dice', results: [5] })).toBe('5');
  });

  it('uma moeda por resultado, com quem lançou', () => {
    const { container } = render(<Toss t={{ what: 'coin', p: 1, results: [1, 0], key: 1, spinMs: 900, captionMs: 400 }} who={() => 'Joey'} />);
    expect(container.querySelectorAll('.coin')).toHaveLength(2);
    expect(container.textContent).toContain('Joey: Cara · Coroa');
  });
});
