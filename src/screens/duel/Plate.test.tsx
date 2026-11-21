// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { Plate } from './Plate';
import { LP_POPUP_MS, LP_STEPS, LP_STEP_MS } from './lp';

const who = { id: 'joey_wheeler', name: 'Joey' };
const props = { side: 'foe' as const, who, hand: 5, turn: false };

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Plate', () => {
  it('mostra nome, LP e a mão; deck e cemitério ficam fora da placa', () => {
    const { container } = render(<Plate {...props} lp={4000} />);
    expect(container.querySelector('.nm')?.textContent).toBe('Joey');
    expect(container.querySelector('.lpn')?.textContent).toBe('4000');
    expect(container.querySelector('.c-hand')?.textContent).toBe('5');
    expect(container.querySelector('.c-deck')).toBeNull();
    expect(container.querySelector('.gravebox')).toBeNull();
  });

  it('dano: popup vermelho, contagem até o valor novo e popup some', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<Plate {...props} lp={4000} />);
    rerender(<Plate {...props} lp={3200} />);
    const pop = container.querySelector('.lpdelta b');
    expect(pop?.textContent).toBe('−800');
    expect(pop?.className).toBe('dmg');
    act(() => { vi.advanceTimersByTime(LP_STEP_MS * LP_STEPS); });
    expect(container.querySelector('.lpn')?.textContent).toBe('3200');
    act(() => { vi.advanceTimersByTime(LP_POPUP_MS); });
    expect(container.querySelector('.lpdelta b')).toBeNull();
  });

  it('cura: popup verde', () => {
    const { container, rerender } = render(<Plate {...props} lp={4000} />);
    rerender(<Plate {...props} lp={4500} />);
    const pop = container.querySelector('.lpdelta b');
    expect(pop?.textContent).toBe('+500');
    expect(pop?.className).toBe('heal');
  });

  it('o espaço do popup existe mesmo sem variação (layout não se desloca)', () => {
    const { container } = render(<Plate {...props} lp={4000} />);
    expect(container.querySelector('.lpdelta')).not.toBeNull();
  });

  it('borda acesa no duelista da vez', () => {
    const { container, rerender } = render(<Plate {...props} lp={4000} turn={false} />);
    expect(container.querySelector('.plate')?.classList.contains('turn')).toBe(false);
    rerender(<Plate {...props} lp={4000} turn />);
    expect(container.querySelector('.plate')?.classList.contains('turn')).toBe(true);
  });

  it('barra pela porcentagem e cor pelo tom', () => {
    const { container } = render(<Plate {...props} lp={500} />);
    expect(container.querySelector('.bar')?.classList.contains('low')).toBe(true);
    expect((container.querySelector('.bar i') as HTMLElement).style.width).toBe('12.5%');
  });
});
