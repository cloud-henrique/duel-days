// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DisplayTitle, Wordmark } from './titles';

afterEach(cleanup);

describe('DisplayTitle', () => {
  it.each([['duel', 'DUELO!'], ['win', 'VITÓRIA!'], ['loss', 'DERROTA'], ['draw', 'EMPATE']] as const)('%s', (tone, text) => {
    render(<DisplayTitle tone={tone}>{text}</DisplayTitle>);
    const h = screen.getByRole('heading');
    expect(h.textContent).toBe(text);
    expect(h.className).toContain(`tone-${tone}`);
    expect(h.className).toContain('display-title');
  });
});

describe('Wordmark', () => {
  it('mostra em caixa alta e é lido como "Duel Days"', () => {
    render(<Wordmark />);
    const h = screen.getByRole('heading', { name: 'Duel Days' });
    expect(h.textContent).toBe('DUEL DAYS');
  });
});
