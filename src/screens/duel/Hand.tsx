import { OcgLocation } from 'ocgcore-wasm';
import type { BoardCard } from '../../engine/protocol';
import type { Cards } from '../../data/cards';
import { refKey } from './prompt';
import { Slot, type OnTapCard } from './Slot';
import { CardBack } from '../../components/CardFace';

/** A carta aberta na folha fica acima das vizinhas. */
const LIFT_Z = 60;
const FOE_DEG_PER_CARD = -4;
const FOE_DROP = 1.5;

/**
 * Mão do jogador em leque; `selected` é a carta aberta na folha (sobe). A geometria (passo, ângulo, queda) fica no
 * CSS: aqui só vão --n (tamanho da mão) e, por carta, --d (distância ao centro) e --ad (|d|).
 */
export function Hand({ hand, cards, hl, selected, onTap }: { hand: BoardCard[]; cards: Cards; hl: Set<string>; selected: number; onTap: OnTapCard }) {
  const n = hand.length;
  const mid = (n - 1) / 2;
  return (
    <div className="handfan" style={{ ['--n' as string]: n }}>
      {hand.map((c, i) => {
        const up = i === selected;
        const cref = { controller: 0 as const, location: OcgLocation.HAND, sequence: i };
        return <Slot key={i} c={c} cards={cards} cref={cref} hl={hl.has(refKey(cref))} onTap={onTap} lift={up}
          style={{ ['--d' as string]: i - mid, ['--ad' as string]: Math.abs(i - mid), zIndex: up ? LIFT_Z : i }} />;
      })}
    </div>
  );
}

/** Mão do oponente: versos pequenos sobrepostos. */
export function FoeHand({ count }: { count: number }) {
  const mid = (count - 1) / 2;
  return (
    <div className="foehand">{Array.from({ length: count }, (_, i) => (
      <div key={i} className="foecard" style={{ transform: `rotate(${(i - mid) * FOE_DEG_PER_CARD}deg) translateY(${Math.abs(i - mid) * FOE_DROP}px)` }}><CardBack /></div>
    ))}</div>
  );
}
