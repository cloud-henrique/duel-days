import { useRef, useState, type PointerEvent } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { OcgResponseType, type OcgCardLoc, type OcgResponse } from 'ocgcore-wasm';
import type { Cards } from '../../data/cards';
import { CardFace } from '../../components/CardFace';
import { dropIndex, initialOrder, moveItem, sortResponseOrder } from './sort';

/** Distância mínima (px) para o toque virar arrasto. */
const DRAG_START = 6;

/**
 * Painel de ordenar cartas (ex.: topo do Deck): arraste as cartas para os lados ou use as setas; a primeira é o topo.
 * Arrasto por Pointer Events (funciona com o dedo no iOS); as setas são a alternativa precisa.
 */
export function SortCards({ cards, list, reply }: { cards: Cards; list: OcgCardLoc[]; reply: (r: OcgResponse) => void }) {
  const [order, setOrder] = useState(() => initialOrder(list.length));
  const [drag, setDrag] = useState<{ pos: number; dx: number } | null>(null);
  const start = useRef<{ x: number; pos: number; step: number } | null>(null);

  const down = (e: PointerEvent<HTMLDivElement>, pos: number) => {
    // Nas setas, deixa o toque virar clique (com a captura, o clique iria para a carta).
    if ((e.target as HTMLElement).closest('button')) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, pos, step: el.getBoundingClientRect().width + 8 };
  };
  const move = (e: PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (drag || Math.abs(dx) > DRAG_START) setDrag({ pos: s.pos, dx });
  };
  const up = () => {
    const s = start.current;
    if (s && drag) setOrder((o) => moveItem(o, s.pos, dropIndex(s.pos, drag.dx, s.step, o.length)));
    start.current = null;
    setDrag(null);
  };

  return <>
    <h4>Ordene as cartas</h4>
    <p className="sub">Arraste para os lados. A primeira fica no topo.</p>
    <div className="sortrow">
      {order.map((cardIndex, pos) => {
        const c = list[cardIndex];
        const dragging = drag?.pos === pos;
        return (
          <div key={cardIndex} className={`sortcard${dragging ? ' dragging' : ''}`} style={dragging ? { transform: `translateX(${drag.dx}px) scale(1.06)` } : undefined}
            onPointerDown={(e) => down(e, pos)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            <span className="sortpos num">{pos === 0 ? 'Topo' : pos + 1}</span>
            <CardFace code={c.code} card={cards[String(c.code)]} />
            <div className="sortarrows">
              <button aria-label="Mover para cima" disabled={pos === 0} onClick={() => setOrder((o) => moveItem(o, pos, pos - 1))}><CaretLeft size={16} weight="bold" /></button>
              <button aria-label="Mover para baixo" disabled={pos === order.length - 1} onClick={() => setOrder((o) => moveItem(o, pos, pos + 1))}><CaretRight size={16} weight="bold" /></button>
            </div>
          </div>
        );
      })}
    </div>
    <button className="hud-btn wide primary" onClick={() => reply({ type: OcgResponseType.SORT_CARD, order: sortResponseOrder(order) })}>Confirmar</button>
  </>;
}
