import { OcgPosition } from 'ocgcore-wasm';
import type { BoardCard } from '../../engine/protocol';
import type { Cards } from '../../data/cards';
import { Backdrop } from '../../components/CardSheet';
import { CardBack, CardFace } from '../../components/CardFace';
import { PILE_NAMES, type PileKind } from './Piles';

/**
 * A lista de uma pilha (Cemitério, Banidas ou o Extra Deck do jogador). Um toque numa carta abre a folha dela. Banida
 * virada para baixo do oponente aparece como verso, sem toque.
 */
export function PileSheet({ p, kind, list, whose, cards, onClose, onPick }: {
  p: 0 | 1; kind: PileKind; list: BoardCard[]; whose: string; cards: Cards; onClose: () => void; onPick: (code: number, index: number) => void;
}) {
  return (
    <div className="scrim center">
      <Backdrop onClose={onClose} />
      <div className="sheet hud">
        <h4>{PILE_NAMES[kind]} de {whose}</h4>
        {list.length === 0 ? <span className="stats">vazio</span>
          : <div className="grid">{list.map((c, i) => (p === 1 && (c.position & OcgPosition.FACEDOWN) !== 0
            ? <span key={i} className="pilehidden" aria-label="Carta virada"><CardBack /></span>
            : <button key={i} type="button" aria-label={cards[String(c.code)]?.name ?? `#${c.code}`} onClick={() => onPick(c.code, i)}><CardFace code={c.code} card={cards[String(c.code)]} /></button>))}</div>}
      </div>
    </div>
  );
}
