import { memo, useEffect, useRef, type HTMLAttributes } from 'react';
import { CardFace } from '../../components/CardFace';
import type { Cards, Tier } from '../../data/cards';
import { GameIcon } from '../../ui/icons';
import { useVirtualGrid, type GridOptions } from '../../ui/virtualGrid';

/**
 * 4 colunas, 4 de espaço, 2 + 2 de margem lateral e borda de 2 na célula (o `.cardgrid` do CSS). Na tela larga, `target`
 * (a largura da carta do tamanho P/M/G) troca as 4 colunas pelas que couberem; o número vai inline no `--cols` do CSS.
 */
const GRID: GridOptions = { cols: 4, gap: 4, padX: 4, border: 2, overscan: 2 };
export interface Copy { code: number; n: number; inDeck: boolean }
export type CellBind = (code: number) => HTMLAttributes<HTMLButtonElement>;

/**
 * A grade da maleta e da Coleção: cada cópia uma miniatura, virtualizada (só as linhas visíveis existem). `resetKey`
 * muda com a ordem, o filtro ou a busca e volta a grade ao topo. `bind` liga o arrastar às células (só no editor).
 */
export function TrunkGrid({ copies, cards, tiers, onOpen, resetKey, empty, bind, drop, target, onScroll }: {
  copies: Copy[]; cards: Cards; tiers: Record<string, Tier>; onOpen: (code: number) => void; resetKey: string; empty: string;
  bind?: CellBind; drop?: string;
  /** Largura-alvo da carta (tela larga); sem ela, 4 colunas. */
  target?: number;
  /** A grade rolou (o painel da tela larga solta o hover). */
  onScroll?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const range = useVirtualGrid(ref, copies.length, target ? { ...GRID, target } : GRID);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [resetKey]);
  return (
    <div className="cardgrid virtual trunkgrid" ref={ref} data-drop={drop} onScroll={onScroll}>
      {copies.length === 0 && <div className="stats trunkempty">{empty}</div>}
      <div className="vgrid" style={{ paddingTop: range.padTop, paddingBottom: range.padBottom, ['--cols' as string]: range.cols }}>
        {copies.slice(range.first, range.end).map(({ code, n, inDeck }) => (
          <GridCell key={`${code}-${n}`} code={code} card={cards[code]} tier={tiers[code]} mark={inDeck} onOpen={onOpen} bind={bind} />
        ))}
      </div>
    </div>
  );
}

/** Uma cópia. Memorizada: ao rolar, só as células que entram na tela são desenhadas. */
const GridCell = memo(function GridCell({ code, card, tier, mark, onOpen, bind }: {
  code: number; card: Cards[string]; tier: Tier; mark: boolean; onOpen: (code: number) => void; bind?: CellBind;
}) {
  return (
    <button className={`cell r-${tier}${mark ? ' indeck' : ''}`} aria-label={`${card.name}${mark ? ', no deck' : ''}`} data-sound="none"
      onClick={() => onOpen(code)} {...bind?.(code)}>
      <CardFace code={code} card={card} />
      {mark && <i aria-hidden="true"><GameIcon name="check" size={12} /></i>}
    </button>
  );
});
