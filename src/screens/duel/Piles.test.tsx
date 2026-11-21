// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { OcgLocation, OcgPosition } from 'ocgcore-wasm';
import type { Board, PlayerBoard } from '../../engine/protocol';
import type { Cards } from '../../data/cards';
import { Field } from './Field';
import { SideCell, deckTier } from './Piles';
import { refKey } from './prompt';

const UP = OcgPosition.FACEUP_ATTACK, DOWN = OcgPosition.FACEDOWN_DEFENSE;
const card = (code: number, name: string, type = 0x11) => ({ code, alias: 0, setcodes: [], type, level: 4, attribute: 1, race: '1', attack: 1000, defense: 1000, lscale: 0, rscale: 0, link_marker: 0, name, desc: '' });
const cards = { 1: card(1, 'Um'), 2: card(2, 'Topo'), 3: card(3, 'Banida'), 9: card(9, 'Umi', 0x80002) } as unknown as Cards;
const szone = (field: number | null) => [null, null, null, null, null, field ? { code: field, position: UP } : null];
const pb = (o: Partial<PlayerBoard> = {}): PlayerBoard => ({ lp: 4000, deck: 26, hand: [], mzone: [null, null, null, null, null], szone: szone(null), grave: [], removed: [], extra: [], ...o });
const boardOf = (me: PlayerBoard, foe: PlayerBoard): Board => ({ players: [me, foe], turn: 1, turnPlayer: 0, phase: 4 });
const side = { cards, hl: new Set<string>(), onTap: () => {}, onOpen: () => {} };

afterEach(cleanup);

/** O `data-loc` das pontas de cada fileira (esquerda e direita), de cima para baixo. */
const ends = (c: HTMLElement) => [...c.querySelectorAll('.field .row')].map((row) =>
  [row.firstElementChild!, row.lastElementChild!].map((s) => [...s.querySelectorAll('[data-loc]')].map((e) => (e as HTMLElement).dataset.loc).join('+')));

describe('tabuleiro do Duel Links', () => {
  it('3 zonas em jogo por fileira e as pilhas nas pontas, a do oponente girada 180°', () => {
    const { container } = render(<Field board={boardOf(pb(), pb())} cards={cards} hl={new Set()} onTap={() => {}} onOpenPile={() => {}} center={null} />);
    const rows = [...container.querySelectorAll('.field .row')];
    expect(rows.map((r) => [...r.querySelectorAll(':scope > .zone')].map((z) => (z as HTMLElement).dataset.loc))).toEqual([
      ['1:szone:1', '1:szone:2', '1:szone:3'], ['1:mzone:1', '1:mzone:2', '1:mzone:3'],
      ['0:mzone:1', '0:mzone:2', '0:mzone:3'], ['0:szone:1', '0:szone:2', '0:szone:3'],
    ]);
    expect(ends(container)).toEqual([
      ['1:deck', '1:extra'],
      ['1:grave+1:removed', '1:szone:5'],
      ['0:szone:5', '0:removed+0:grave'],
      ['0:extra', '0:deck'],
    ]);
  });

  it('ficha de Banidas vazia: no lugar, apagada e com 0', () => {
    const { container } = render(<SideCell cell="stack" p={0} pl={pb()} {...side} />);
    const removed = container.querySelector('[data-loc="0:removed"]')!;
    expect(removed.classList.contains('empty')).toBe(true);
    expect(removed.querySelector('.mini.none')).not.toBeNull();
    expect(removed.querySelector('.cnt b')?.textContent).toBe('0');
  });

  it('cemitério mostra o topo; banida virada para baixo mostra o verso; quantidades', () => {
    const pl = pb({ grave: [{ code: 1, position: UP }, { code: 2, position: UP }], removed: [{ code: 3, position: DOWN }], extra: [{ code: 1, position: DOWN }] });
    const { container } = render(<Field board={boardOf(pb(), pl)} cards={cards} hl={new Set()} onTap={() => {}} onOpenPile={() => {}} center={null} />);
    const grave = container.querySelector('[data-loc="1:grave"]')!;
    expect(grave.querySelector('.cf-art img')?.getAttribute('src')).toContain('cards/thumb/2.webp');
    expect(grave.querySelector('.cnt b')?.textContent).toBe('2');
    expect(container.querySelector('[data-loc="1:removed"] .cardback-img')).not.toBeNull();
    expect(container.querySelector('[data-loc="1:extra"] .cnt b')?.textContent).toBe('1');
    expect(container.querySelector('[data-loc="1:deck"] .cnt b')?.textContent).toBe('26');
  });

  it('abre a lista do cemitério, das banidas e do Extra do jogador; o Extra do oponente não abre', () => {
    const onOpen = vi.fn();
    const pl = pb({ extra: [{ code: 1, position: DOWN }] });
    const { container } = render(<Field board={boardOf(pl, pl)} cards={cards} hl={new Set()} onTap={() => {}} onOpenPile={onOpen} center={null} />);
    for (const loc of ['0:extra', '0:grave', '0:removed', '1:grave']) fireEvent.click(container.querySelector(`[data-loc="${loc}"]`)!);
    expect(onOpen.mock.calls).toEqual([[0, 'extra'], [0, 'grave'], [0, 'removed'], [1, 'grave']]);
    expect(container.querySelector('[data-loc="1:extra"]')!.tagName).toBe('DIV');
    expect(container.querySelector('[data-loc="1:deck"]')!.tagName).toBe('DIV');
  });

  it('a Zona de Campo é uma zona: mostra a carta, brilha quando pode ser escolhida e recebe o toque', () => {
    const onTap = vi.fn();
    const ref = { controller: 1 as const, location: OcgLocation.SZONE, sequence: 5 };
    const { container } = render(<SideCell cell="field" p={1} pl={pb({ szone: szone(9) })} {...side} hl={new Set([refKey(ref)])} onTap={onTap} />);
    const f = container.querySelector('[data-loc="1:szone:5"]')!;
    expect(f.classList.contains('hl')).toBe(true);
    fireEvent.click(f);
    expect(onTap).toHaveBeenCalledWith(9, ref, false);
  });

  it('espessura do deck em degraus', () => {
    expect([0, 1, 10, 11, 25, 26, 30].map(deckTier)).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });
});
