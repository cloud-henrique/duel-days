// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Toss, tossCaption, tossTexts } from './Toss';

afterEach(cleanup);

describe('Toss', () => {
  it('legenda: Cara/Coroa na moeda, o número no dado', () => {
    expect(tossCaption({ what: 'coin', results: [1] })).toBe('Cara');
    expect(tossCaption({ what: 'coin', results: [0, 1] })).toBe('Coroa · Cara');
    expect(tossCaption({ what: 'dice', results: [5] })).toBe('5');
  });

  it('uma moeda por resultado, com quem lançou', () => {
    const { container } = render(<Toss t={{ what: 'coin', p: 1, results: [1, 0], key: 1, spinMs: 900, captionMs: 400 }} who={() => 'Joey'} />);
    expect(container.querySelectorAll('.coin3d')).toHaveLength(2);
    expect(container.textContent).toContain('Joey: Cara · Coroa');
  });

  it('com a escolha do jogador: "Você disse …" acima e o acerto ou erro embaixo', () => {
    const who = () => 'Ana';
    expect(tossTexts({ what: 'coin', p: 0, results: [0], call: 'heads' }, who)).toEqual({ above: 'Você disse cara', below: 'Errou!' });
    expect(tossTexts({ what: 'coin', p: 0, results: [0], call: 'tails' }, who)).toEqual({ above: 'Você disse coroa', below: 'Acertou!' });
    expect(tossTexts({ what: 'coin', p: 1, results: [1] }, who)).toEqual({ above: null, below: 'Ana: Cara' });
    expect(tossTexts({ what: 'dice', p: 0, results: [4] }, who)).toEqual({ above: null, below: 'Ana: 4' });
  });
});
