import { OcgLocation, OcgPosition } from 'ocgcore-wasm';
import type { Board, BoardCard } from '../../engine/protocol';
import type { CardRef } from './prompt';

/**
 * Peças puras da tela larga do duelo (change layout-desktop): qual carta está sob o ponteiro (pelo `data-loc`) e onde
 * fica a fileira de ações sobre a carta fixada.
 */

/** A carta em foco no painel: o código e o lugar (para as ligações e as ações). */
export interface Focus { code: number; ref: CardRef }

const ZONE_LOCATION: Record<string, OcgLocation> = {
  hand: OcgLocation.HAND, mzone: OcgLocation.MZONE, szone: OcgLocation.SZONE, grave: OcgLocation.GRAVE, removed: OcgLocation.REMOVED,
};
const facedown = (c: BoardCard) => (c.position & OcgPosition.FACEDOWN) !== 0;

/**
 * A carta visível num lugar da tela (`p:zone:seq` ou `p:pilha`), ou nulo: zona vazia, deck, Extra, placa, a mão do
 * oponente e as cartas viradas do oponente não mostram nada (as viradas do jogador, sim: ele as conhece). Nas pilhas
 * (Cemitério e Banidas), a do topo.
 */
export function cardAtLoc(board: Board, loc: string): Focus | null {
  const [ps, zone, seqs] = loc.split(':');
  const p = Number(ps);
  if (p !== 0 && p !== 1) return null;
  const location = ZONE_LOCATION[zone];
  if (location === undefined) return null;
  const pl = board.players[p];
  let c: BoardCard | null | undefined;
  let sequence = Number(seqs);
  if (zone === 'grave' || zone === 'removed') {
    const list = pl[zone];
    sequence = list.length - 1;
    c = list[sequence];
  } else if (zone === 'hand') {
    if (p === 1) return null;
    c = pl.hand[sequence];
  } else {
    c = (zone === 'mzone' ? pl.mzone : pl.szone)[sequence];
  }
  if (!c || (p === 1 && facedown(c))) return null;
  return { code: c.code, ref: { controller: p, location, sequence } };
}

export interface Rect { left: number; top: number; width: number; height: number }

/**
 * Onde pôr a fileira de ações (largura `w`, altura `h`) sobre a carta (`card`), dentro da área (`area`, a tela de
 * duelo), com `gap` de folga: centrada acima da carta; sem espaço acima, abaixo dela. Presa às bordas da área.
 * Coordenadas relativas à área.
 */
export function actionsPos(card: Rect, w: number, h: number, area: { width: number; height: number }, gap: number): { left: number; top: number; below: boolean } {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const left = clamp(card.left + card.width / 2 - w / 2, gap, Math.max(gap, area.width - w - gap));
  const above = card.top - gap - h;
  if (above >= gap) return { left, top: above, below: false };
  return { left, top: clamp(card.top + card.height + gap, gap, Math.max(gap, area.height - h - gap)), below: true };
}
