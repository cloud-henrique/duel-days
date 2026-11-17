// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Plate } from './Plate';
import type { Cards } from '../../data/cards';
import { LP_POPUP_MS, LP_STEPS, LP_STEP_MS } from './lp';

const who = { id: 'joey_wheeler', name: 'Joey' };
const props = { side: 'foe' as const, who, deck: 35, hand: 5, grave: [], turn: false, onGrave: () => {} };

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Plate', () => {
  it('mostra nome, LP e contadores', () => {
    const { container } = render(<Plate {...props} lp={8000} />);
    expect(container.querySelector('.nm')?.textContent).toBe('Joey');
    expect(container.querySelector('.lpn')?.textContent).toBe('8000');
    expect(container.querySelector('.c-deck')?.textContent).toBe('35');
    expect(container.querySelector('.c-hand')?.textContent).toBe('5');
  });

  it('dano: popup vermelho, contagem até o valor novo e popup some', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<Plate {...props} lp={8000} />);
    rerender(<Plate {...props} lp={7200} />);
    const pop = container.querySelector('.lpdelta b');
    expect(pop?.textContent).toBe('−800');
    expect(pop?.className).toBe('dmg');
    act(() => { vi.advanceTimersByTime(LP_STEP_MS * LP_STEPS); });
    expect(container.querySelector('.lpn')?.textContent).toBe('7200');
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
    const { container } = render(<Plate {...props} lp={8000} />);
    expect(container.querySelector('.lpdelta')).not.toBeNull();
  });

  it('borda acesa no duelista da vez', () => {
    const { container, rerender } = render(<Plate {...props} lp={8000} turn={false} />);
    expect(container.querySelector('.plate')?.classList.contains('turn')).toBe(false);
    rerender(<Plate {...props} lp={8000} turn />);
    expect(container.querySelector('.plate')?.classList.contains('turn')).toBe(true);
  });

  it('cemitério vazio fica tracejado; com cartas mostra o topo e abre a lista', () => {
    const onGrave = vi.fn();
    const { container, rerender } = render(<Plate {...props} lp={8000} onGrave={onGrave} />);
    expect(container.querySelector('.gslot')?.classList.contains('empty')).toBe(true);
    const cards = { 2: { code: 2, alias: 0, setcodes: [], type: 0x11, level: 4, attribute: 1, race: '1', attack: 1000, defense: 1000, lscale: 0, rscale: 0, link_marker: 0, name: 'Topo', desc: '' } } as unknown as Cards;
    rerender(<Plate {...props} lp={8000} onGrave={onGrave} cards={cards} grave={[{ code: 1, position: 1 }, { code: 2, position: 1 }]} />);
    expect(container.querySelector('.gslot .cf-art img')?.getAttribute('src')).toContain('cards/thumb/2.webp');
    expect(container.querySelector('.gravebox em')?.textContent).toBe('2');
    fireEvent.click(container.querySelector('.gravebox')!);
    expect(onGrave).toHaveBeenCalledOnce();
  });

  it('barra pela porcentagem e cor pelo tom', () => {
    const { container } = render(<Plate {...props} lp={1000} />);
    expect(container.querySelector('.bar')?.classList.contains('low')).toBe(true);
    expect((container.querySelector('.bar i') as HTMLElement).style.width).toBe('12.5%');
  });
});
