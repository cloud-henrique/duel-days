// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { OcgLocation, OcgResponseType, OcgType as T } from 'ocgcore-wasm';
import type { Cards } from '../../data/cards';
import { SortCards } from './SortCards';

const card = (code: number, name: string) => ({ code, type: T.MONSTER | T.NORMAL, level: 4, attribute: 1, race: '1', attack: 1000, defense: 1000, name, desc: '' });
const cards = { 10: card(10, 'A'), 20: card(20, 'B'), 30: card(30, 'C') } as unknown as Cards;
const list = [10, 20, 30].map((code, sequence) => ({ code, controller: 0 as const, location: OcgLocation.DECK, sequence }));

afterEach(cleanup);

describe('SortCards', () => {
  it('mostra as cartas na ordem da mensagem, com a primeira marcada como topo', () => {
    const { container } = render(<SortCards cards={cards} list={list} reply={() => {}} />);
    expect([...container.querySelectorAll('.cf-name span')].map((s) => s.textContent)).toEqual(['A', 'B', 'C']);
    expect(container.querySelector('.sortpos')?.textContent).toBe('Topo');
  });

  it('as setas reordenam e o Confirmar manda a posição nova de cada carta', () => {
    const reply = vi.fn();
    const { container, getByText } = render(<SortCards cards={cards} list={list} reply={reply} />);
    // C para o topo: duas vezes "para cima".
    fireEvent.click(container.querySelectorAll('[aria-label="Mover para cima"]')[2]);
    fireEvent.click(container.querySelectorAll('[aria-label="Mover para cima"]')[1]);
    expect([...container.querySelectorAll('.cf-name span')].map((s) => s.textContent)).toEqual(['C', 'A', 'B']);
    fireEvent.click(getByText('Confirmar'));
    expect(reply).toHaveBeenCalledWith({ type: OcgResponseType.SORT_CARD, order: [1, 2, 0] });
  });

  it('as pontas não têm seta para fora', () => {
    const { container } = render(<SortCards cards={cards} list={list} reply={() => {}} />);
    expect((container.querySelectorAll('[aria-label="Mover para cima"]')[0] as HTMLButtonElement).disabled).toBe(true);
    expect((container.querySelectorAll('[aria-label="Mover para baixo"]')[2] as HTMLButtonElement).disabled).toBe(true);
  });
});
