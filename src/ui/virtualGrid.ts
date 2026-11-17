/**
 * Grade virtualizada de cartas: só as linhas visíveis (e uma folga) existem na página. A grade é uniforme (colunas
 * iguais, todas as células com a proporção da carta), então a altura da linha sai da largura do contêiner, sem medir
 * célula por célula. A rolagem continua nativa (o momentum do iOS fica intacto): o hook só escuta o `scroll`.
 */
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** Proporção da face da carta (altura / largura), a mesma do `.cardface` (59 × 86). */
export const CARD_RATIO = 86 / 59;

export interface GridMetrics { width: number; height: number; scrollTop: number }
export interface GridOptions { cols: number; gap: number; padX: number; border: number; overscan: number }
export interface GridRange { first: number; end: number; padTop: number; padBottom: number; rowH: number }

/** Altura de uma linha (célula + espaço) para a largura útil do contêiner. */
export function rowHeight(width: number, o: Pick<GridOptions, 'cols' | 'gap' | 'padX' | 'border'>): number {
  const col = (width - o.padX - o.gap * (o.cols - 1)) / o.cols;
  return (col - 2 * o.border) * CARD_RATIO + 2 * o.border + o.gap;
}

/**
 * Faixa de itens a montar: as linhas que tocam a área visível mais `overscan` linhas acima e abaixo. `first` e `end`
 * são índices de item (`end` exclusivo); `padTop`/`padBottom` são as alturas que ficam no lugar das linhas de fora.
 */
export function gridRange(count: number, m: GridMetrics, o: GridOptions): GridRange {
  const rowH = Math.max(1, rowHeight(m.width, o));
  const rows = Math.ceil(count / o.cols);
  if (rows === 0) return { first: 0, end: 0, padTop: 0, padBottom: 0, rowH };
  const top = Math.max(0, Math.min(rows - 1, Math.floor(m.scrollTop / rowH) - o.overscan));
  const bottom = Math.max(top, Math.min(rows - 1, Math.ceil((m.scrollTop + m.height) / rowH) - 1 + o.overscan));
  return { first: top * o.cols, end: Math.min(count, (bottom + 1) * o.cols), padTop: top * rowH, padBottom: (rows - 1 - bottom) * rowH, rowH };
}

/** Medida de reserva antes da primeira medição (e em ambientes sem layout, como os testes): um iPhone em pé. */
const FALLBACK: GridMetrics = { width: 375, height: 640, scrollTop: 0 };

const same = (a: GridRange, b: GridRange) => a.first === b.first && a.end === b.end && a.padTop === b.padTop && a.padBottom === b.padBottom;

/**
 * Liga `gridRange` a um contêiner com rolagem: mede largura e altura (ResizeObserver) e acompanha o `scroll`. O estado
 * só muda quando a faixa de linhas muda (não a cada quadro de rolagem), para a tela não ser desenhada de novo à toa.
 */
export function useVirtualGrid(ref: RefObject<HTMLElement | null>, count: number, o: GridOptions): GridRange {
  const opts = useRef(o);
  opts.current = o;
  const countRef = useRef(count);
  countRef.current = count;
  const [range, setRange] = useState<GridRange>(() => gridRange(count, FALLBACK, o));
  const read = useRef<() => void>(() => {});
  read.current = () => {
    const el = ref.current;
    const m = el ? { width: el.clientWidth || FALLBACK.width, height: el.clientHeight || FALLBACK.height, scrollTop: el.scrollTop } : FALLBACK;
    const next = gridRange(countRef.current, m, opts.current);
    setRange((p) => (same(p, next) ? p : next));
  };
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const tick = () => { frame = 0; read.current(); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(tick); };
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => read.current()) : null;
    ro?.observe(el);
    return () => { el.removeEventListener('scroll', onScroll); ro?.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, [ref]);
  // A lista mudou de tamanho (filtro, aba): recalcula já, com a posição que o navegador pode ter ajustado.
  useLayoutEffect(() => read.current(), [count]);
  return range;
}
