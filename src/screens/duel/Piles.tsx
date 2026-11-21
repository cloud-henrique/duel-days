import { OcgLocation, OcgPosition } from 'ocgcore-wasm';
import type { BoardCard, PlayerBoard } from '../../engine/protocol';
import type { Cards } from '../../data/cards';
import { CardBack, CardFace } from '../../components/CardFace';
import { GameIcon, type GameIconName } from '../../ui/icons';
import { Slot, markOf, type OnTapCard } from './Slot';
import { FIELD_SEQ } from './fieldArt';

/** As pilhas que abrem lista ao toque. */
export type PileKind = 'grave' | 'removed' | 'extra';
export const PILE_NAMES: Record<PileKind, string> = { grave: 'Cemitério', removed: 'Banidas', extra: 'Extra Deck' };
export const PILE_LOCATION: Record<PileKind, OcgLocation> = { grave: OcgLocation.GRAVE, removed: OcgLocation.REMOVED, extra: OcgLocation.EXTRA };

/** Degrau da espessura do deck: 0, 1–10, 11–25, 26+. */
export const deckTier = (n: number) => (n <= 0 ? 0 : n <= 10 ? 1 : n <= 25 ? 2 : 3);

/**
 * O que fica nas pontas de cada fileira de zonas (change speed-duel, tabuleiro do Duel Links), do ponto de vista de quem
 * olha a tela: [esquerda, direita]. Jogador: Campo e Extra à esquerda; Banidas + Cemitério e Deck à direita. O oponente
 * é a mesma disposição girada 180°. `stack` é a ficha de Banidas com o Cemitério.
 */
export type SideCell = 'field' | 'extra' | 'deck' | 'stack';
export type RowKind = 'm' | 's';
export const SIDES: Record<0 | 1, Record<RowKind, readonly [SideCell, SideCell]>> = {
  0: { m: ['field', 'stack'], s: ['extra', 'deck'] },
  1: { s: ['deck', 'extra'], m: ['stack', 'field'] },
};

const ICON: Record<'deck' | 'extra' | 'grave' | 'removed', GameIconName> = { deck: 'deck', extra: 'extraDeck', grave: 'graveyard', removed: 'banished' };
const LABEL: Record<'deck' | 'extra' | 'grave' | 'removed', string> = { deck: 'Deck', extra: 'Extra Deck', grave: 'Cemitério', removed: 'Banidas' };

interface Props {
  p: 0 | 1; pl: PlayerBoard; cards: Cards; hl: Set<string>; picked?: Set<string>; rel?: Set<string>; onTap: OnTapCard;
  /** Abrir a lista de uma pilha (o Extra Deck do oponente nunca abre). */
  onOpen: (p: 0 | 1, kind: PileKind) => void;
}

/** Uma ponta de fileira: a Zona de Campo (uma zona do motor, `szone` 5), uma pilha ou a ficha de Banidas com o Cemitério. */
export function SideCell({ cell, ...o }: Props & { cell: SideCell }) {
  const { p, pl, cards, hl, picked, rel, onTap } = o;
  if (cell === 'field') {
    const cref = { controller: p, location: OcgLocation.SZONE, sequence: FIELD_SEQ };
    return <div className="side fieldzone"><Slot c={pl.szone[FIELD_SEQ] ?? null} cards={cards} zone="f" foe={p === 1} cref={cref} mark={markOf(cref, hl, picked, rel)} onTap={onTap} /></div>;
  }
  if (cell === 'stack') {
    // A ficha de Banidas fica do lado de fora do campo: em cima do Cemitério no jogador, embaixo no oponente.
    const chip = <Pile key="removed" slot="removed" {...o} />;
    const grave = <Pile key="grave" slot="grave" {...o} />;
    return <div className="side stack">{p === 0 ? [chip, grave] : [grave, chip]}</div>;
  }
  return <div className={`side ${cell}`}><Pile slot={cell} {...o} /></div>;
}

/** Uma pilha: a carta pequena (topo ou verso) e o ícone com a quantidade; `data-loc` = `p:pilha` (voos da encenação). */
function Pile({ slot, p, pl, cards, onOpen }: Props & { slot: 'deck' | 'extra' | 'grave' | 'removed' }) {
  const list: BoardCard[] | null = slot === 'grave' ? pl.grave : slot === 'removed' ? pl.removed : slot === 'extra' ? pl.extra : null;
  const n = slot === 'deck' ? pl.deck : list!.length;
  const top = slot === 'grave' || slot === 'removed' ? list![list!.length - 1] : undefined;
  const faceUp = !!top && (top.position & OcgPosition.FACEDOWN) === 0;
  const mini = slot === 'deck' || slot === 'extra'
    ? (n ? <span className={`mini t${slot === 'deck' ? deckTier(n) : 1}`}><CardBack /></span> : <span className="mini none" />)
    : top ? <span className="mini">{faceUp ? <CardFace code={top.code} card={cards[String(top.code)]} /> : <CardBack />}</span> : <span className="mini none" />;
  const body = <><span className="slotbox">{mini}</span><span className="cnt"><GameIcon name={ICON[slot]} /><b className="num">{n}</b></span></>;
  const cls = `pile cut ${slot}${n ? '' : ' empty'}`;
  const label = `${LABEL[slot]}: ${n}`;
  const opens = slot !== 'deck' && !(slot === 'extra' && p === 1);
  return opens
    ? <button type="button" className={cls} data-loc={`${p}:${slot}`} aria-label={label} onClick={() => onOpen(p, slot as PileKind)}>{body}</button>
    : <div className={cls} data-loc={`${p}:${slot}`} aria-label={label} role="img">{body}</div>;
}
