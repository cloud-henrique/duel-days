import { OcgLocation } from 'ocgcore-wasm';
import type { BoardCard } from '../../engine/protocol';
import type { Cards } from '../../data/cards';
import { Slot, markOf, type OnTapCard } from './Slot';
import { CardBack } from '../../components/CardFace';

/** A carta aberta na folha fica acima das vizinhas. */
const LIFT_Z = 60;
const FOE_DEG_PER_CARD = -4;
const FOE_DROP = 1.5;

/**
 * Mão do jogador, reta (change speed-duel); `selected` é a carta aberta na folha (sobe). A geometria (passo) fica no
 * CSS: aqui só vão --n (tamanho da mão) e, por carta, --d (distância ao centro).
 */
export function Hand({ hand, cards, hl, picked, selected, onTap }: { hand: BoardCard[]; cards: Cards; hl: Set<string>; picked?: Set<string>; selected: number; onTap: OnTapCard }) {
  const n = hand.length;
  const mid = (n - 1) / 2;
  return (
    <div className="handfan" data-loc="0:hand" style={{ ['--n' as string]: n }}>
      {hand.map((c, i) => {
        const up = i === selected;
        const cref = { controller: 0 as const, location: OcgLocation.HAND, sequence: i };
        return <Slot key={i} c={c} cards={cards} cref={cref} mark={markOf(cref, hl, picked)} onTap={onTap} lift={up}
          style={{ ['--d' as string]: i - mid, zIndex: up ? LIFT_Z : i }} />;
      })}
    </div>
  );
}

/** Mão do oponente: versos pequenos sobrepostos. */
export function FoeHand({ count }: { count: number }) {
  const mid = (count - 1) / 2;
  return (
    <div className="foehand" data-loc="1:hand">{Array.from({ length: count }, (_, i) => (
      <div key={i} className="foecard" data-loc={`1:hand:${i}`} style={{ transform: `rotate(${(i - mid) * FOE_DEG_PER_CARD}deg) translateY(${Math.abs(i - mid) * FOE_DROP}px)` }}><CardBack /></div>
    ))}</div>
  );
}
