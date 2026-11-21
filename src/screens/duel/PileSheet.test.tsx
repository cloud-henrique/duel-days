// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { OcgPosition } from 'ocgcore-wasm';
import type { Cards } from '../../data/cards';
import { PileSheet } from './PileSheet';

const card = (code: number, name: string) => ({ code, alias: 0, setcodes: [], type: 0x11, level: 4, attribute: 1, race: '1', attack: 1000, defense: 1000, lscale: 0, rscale: 0, link_marker: 0, name, desc: '' });
const cards = { 1: card(1, 'Um'), 2: card(2, 'Dois') } as unknown as Cards;
const list = [{ code: 1, position: OcgPosition.FACEUP_ATTACK }, { code: 2, position: OcgPosition.FACEDOWN_DEFENSE }];

afterEach(cleanup);

describe('PileSheet', () => {
  it('título com a pilha e o dono; toque numa carta abre a folha dela', () => {
    const onPick = vi.fn();
    const { container, getByText } = render(<PileSheet p={0} kind="removed" list={list} whose="Ana" cards={cards} onClose={() => {}} onPick={onPick} />);
    expect(getByText('Banidas de Ana')).toBeTruthy();
    const buttons = container.querySelectorAll('.grid > button');
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]);
    expect(onPick).toHaveBeenCalledWith(2, 1);
  });

  it('banida virada para baixo do oponente fica escondida', () => {
    const { container } = render(<PileSheet p={1} kind="removed" list={list} whose="Joey" cards={cards} onClose={() => {}} onPick={() => {}} />);
    expect(container.querySelectorAll('.grid > button')).toHaveLength(1);
    expect(container.querySelector('.grid > .pilehidden')).not.toBeNull();
  });

  it('pilha vazia', () => {
    const { getByText } = render(<PileSheet p={0} kind="grave" list={[]} whose="Ana" cards={cards} onClose={() => {}} onPick={() => {}} />);
    expect(getByText('vazio')).toBeTruthy();
  });
});
