// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { PhaseBar } from './PhaseBar';

afterEach(cleanup);

describe('PhaseBar', () => {
  it('mostra o turno e todos os chips, com a fase atual acesa', () => {
    const { container } = render(<PhaseBar turn={3} phase={8} narration="" />);
    expect(container.querySelector('.tn')?.textContent).toBe('T3');
    expect([...container.querySelectorAll('.chip')].map((c) => c.textContent)).toEqual(['DP', 'SP', 'M1', 'BP', 'EP']);
    expect(container.querySelector('.chip.on')?.textContent).toBe('BP');
  });

  it('o narrador mostra o último acontecimento', () => {
    const { container, rerender } = render(<PhaseBar turn={1} phase={4} narration="Você comprou Kuriboh" />);
    expect(container.querySelector('.narr')?.textContent).toBe('Você comprou Kuriboh');
    rerender(<PhaseBar turn={1} phase={4} narration="Oponente invocou Mago Negro" />);
    expect(container.querySelector('.narr')?.textContent).toBe('Oponente invocou Mago Negro');
  });
});
