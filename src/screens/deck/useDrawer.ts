import { useLayoutEffect, useRef, useState, type HTMLAttributes, type RefObject } from 'react';
import { useStored } from './useStored';

export type DrawerPos = 'collapsed' | 'middle' | 'open';
const POSITIONS: DrawerPos[] = ['collapsed', 'middle', 'open'];
const isPos = (v: unknown): v is DrawerPos => POSITIONS.includes(v as DrawerPos);
/** Recolhida, a maleta é só a alça (`DeckDrawer.collapsedTrunkHeight` do nativo). */
export const HANDLE_H = 62;
/** No meio, o deck fica com 40% da altura. */
const MIDDLE = 0.4;

/** Altura de uma linha do painel do deck (6 colunas, carta 59×86, 4 de espaço) mais o título do grupo. */
const oneRow = (width: number) => ((width - 16 - 5 * 4) / 6) * (86 / 59) + 40;

/**
 * A gaveta da maleta (`DeckDrawer` do nativo): três posições lembradas no aparelho e a altura do painel do deck em cada
 * uma, medida no contêiner. A alça alterna com um toque (recolhida → meio → aberta → meio) e pode ser arrastada: solta,
 * encaixa na posição mais perto.
 */
export function useDrawer(body: RefObject<HTMLElement | null>) {
  const [pos, setPos] = useStored<DrawerPos>('duel-days.deck.drawer', 'middle', isPos);
  const [size, setSize] = useState({ w: 375, h: 600 });
  const [live, setLive] = useState<number | null>(null);
  const drag = useRef<{ y: number; start: number; moved: boolean } | null>(null);
  /** O clique que vem depois de arrastar a alça não alterna a posição. */
  const dragged = useRef(false);

  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth || 375, h: el.clientHeight || 600 });
    read();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [body]);

  const heightOf = (p: DrawerPos) => {
    const all = Math.max(size.h - HANDLE_H, 0);
    if (p === 'collapsed') return all;
    if (p === 'middle') return Math.round(size.h * MIDDLE);
    return Math.min(Math.round(oneRow(size.w)), all);
  };
  const next = (p: DrawerPos): DrawerPos => (p === 'middle' ? 'open' : 'middle');
  const nearest = (h: number) => POSITIONS.reduce((a, b) => (Math.abs(heightOf(b) - h) < Math.abs(heightOf(a) - h) ? b : a));

  const handle: HTMLAttributes<HTMLButtonElement> = {
    onPointerDown: (e) => {
      drag.current = { y: e.clientY, start: heightOf(pos), moved: false };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d) return;
      const dy = e.clientY - d.y;
      if (Math.abs(dy) > 6) d.moved = true;
      if (d.moved) setLive(Math.max(heightOf('open'), Math.min(heightOf('collapsed'), d.start + dy)));
    },
    onPointerUp: () => {
      const d = drag.current;
      drag.current = null;
      dragged.current = !!d?.moved;
      if (d?.moved && live != null) setPos(nearest(live));
      setLive(null);
    },
    onPointerCancel: () => { drag.current = null; setLive(null); },
    onClick: () => { if (dragged.current) { dragged.current = false; return; } setPos(next(pos)); },
  };

  return { pos, setPos, deckHeight: live ?? heightOf(pos), dragging: live != null, handle };
}
