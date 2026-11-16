/**
 * Escolha de cartas (SELECT_CARD, SELECT_TRIBUTE, SELECT_UNSELECT_CARD) sem React. Como no nativo:
 * - no **tabuleiro** quando todas as opções estão no campo ou na mão do jogador: as cartas brilham e o jogador toca nelas;
 * - em **lista** (fileira de cartas) quando alguma está fora do campo (deck, cemitério, banidas, Extra) ou na mão do
 *   oponente (ex.: Troca), que a tela desenha só com versos e sem toque.
 */
import { OcgLocation, OcgMessageType, OcgResponseType, type OcgMessage, type OcgResponse } from 'ocgcore-wasm';
import { refKey, type CardRef } from './prompt';

export interface ChoiceOption { ref: CardRef; code: number; weight: number }
export interface Choice {
  type: OcgMessageType.SELECT_CARD | OcgMessageType.SELECT_TRIBUTE | OcgMessageType.SELECT_UNSELECT_CARD;
  mode: 'board' | 'list';
  options: ChoiceOption[];
  /** Só no SELECT_UNSELECT_CARD: cartas já marcadas (tocar desmarca). */
  marked: ChoiceOption[];
  min: number;
  max: number;
  canCancel: boolean;
  /** SELECT_UNSELECT_CARD: pode encerrar a escolha. */
  canFinish: boolean;
}

/** Onde a escolha pode ser feita tocando na carta: o campo dos dois lados e a mão do jogador (a do oponente são versos). */
const ON_FIELD = OcgLocation.MZONE | OcgLocation.SZONE;
const tappable = (r: CardRef) => (r.location & ON_FIELD) !== 0 || (r.location === OcgLocation.HAND && r.controller === 0);

type Loc = { code: number; controller: number; location: number; sequence: number };
const opt = (x: Loc, weight = 1): ChoiceOption => ({ ref: { controller: x.controller as 0 | 1, location: x.location, sequence: x.sequence }, code: x.code, weight });

export function choiceOf(m: OcgMessage | null): Choice | null {
  if (!m) return null;
  let options: ChoiceOption[];
  let marked: ChoiceOption[] = [];
  if (m.type === OcgMessageType.SELECT_CARD) options = m.selects.map((x) => opt(x));
  // Tributo: cada carta pode valer 1 ou 2 (release_param); a soma é que conta.
  else if (m.type === OcgMessageType.SELECT_TRIBUTE) options = m.selects.map((x) => opt(x, x.release_param || 1));
  else if (m.type === OcgMessageType.SELECT_UNSELECT_CARD) { options = m.select_cards.map((x) => opt(x)); marked = m.unselect_cards.map((x) => opt(x)); }
  else return null;
  const all = [...options, ...marked];
  const mode = all.every((o) => tappable(o.ref)) ? 'board' : 'list';
  return {
    type: m.type, mode, options, marked, min: m.min, max: m.max, canCancel: m.can_cancel,
    canFinish: m.type === OcgMessageType.SELECT_UNSELECT_CARD && m.can_finish,
  };
}

/** Soma do que está marcado (índices de `options`). */
export const chosenWeight = (c: Choice, sel: number[]) => sel.reduce((a, i) => a + (c.options[i]?.weight ?? 0), 0);
/** Pode confirmar com o que está marcado. */
export const canConfirm = (c: Choice, sel: number[]) => { const w = chosenWeight(c, sel); return w >= c.min && w <= c.max; };
/** O toque já decide: não há como marcar mais nada (chegou ao máximo). Com min = max = 1, o primeiro toque. */
export const isComplete = (c: Choice, sel: number[]) => c.type !== OcgMessageType.SELECT_UNSELECT_CARD && chosenWeight(c, sel) >= c.max && canConfirm(c, sel);

/** Resposta com os índices marcados (SELECT_CARD/TRIBUTE). */
export function confirmResponse(c: Choice, sel: number[]): OcgResponse {
  const type = c.type === OcgMessageType.SELECT_TRIBUTE ? OcgResponseType.SELECT_TRIBUTE : OcgResponseType.SELECT_CARD;
  return { type, indicies: sel } as OcgResponse;
}
/** Cancelar; no SELECT_UNSELECT_CARD, a mesma resposta também encerra a escolha ("Concluir"). */
export function cancelResponse(c: Choice): OcgResponse {
  if (c.type === OcgMessageType.SELECT_UNSELECT_CARD) return { type: OcgResponseType.SELECT_UNSELECT_CARD, index: null };
  return { type: c.type === OcgMessageType.SELECT_TRIBUTE ? OcgResponseType.SELECT_TRIBUTE : OcgResponseType.SELECT_CARD, indicies: null } as OcgResponse;
}

/**
 * Toque numa opção. Devolve a nova marcação e, se o toque já decide, a resposta ao motor.
 * No SELECT_UNSELECT_CARD cada toque é uma resposta (marcar = índice em select_cards; desmarcar = depois deles).
 */
export function tapOption(c: Choice, sel: number[], ref: CardRef): { sel: number[]; response?: OcgResponse } | null {
  const k = refKey(ref);
  const i = c.options.findIndex((o) => refKey(o.ref) === k);
  if (c.type === OcgMessageType.SELECT_UNSELECT_CARD) {
    if (i >= 0) return { sel, response: { type: OcgResponseType.SELECT_UNSELECT_CARD, index: i } };
    const j = c.marked.findIndex((o) => refKey(o.ref) === k);
    return j >= 0 ? { sel, response: { type: OcgResponseType.SELECT_UNSELECT_CARD, index: c.options.length + j } } : null;
  }
  if (i < 0) return null;
  if (sel.includes(i)) return { sel: sel.filter((x) => x !== i) };
  const next = [...sel, i];
  if (chosenWeight(c, next) > c.max) return { sel };
  return isComplete(c, next) ? { sel: next, response: confirmResponse(c, next) } : { sel: next };
}

/** Chaves das cartas que brilham (podem ser escolhidas) e das marcadas, para o tabuleiro. */
export function choiceMarks(c: Choice | null, sel: number[]): { glow: Set<string>; picked: Set<string> } {
  const glow = new Set<string>();
  const picked = new Set<string>();
  if (!c || c.mode !== 'board') return { glow, picked };
  c.options.forEach((o, i) => (sel.includes(i) ? picked : glow).add(refKey(o.ref)));
  c.marked.forEach((o) => picked.add(refKey(o.ref)));
  return { glow, picked };
}

/** Título e dica da barra de escolha no tabuleiro (textos do nativo). */
export function choiceText(c: Choice, actor: string | null, attack: boolean): { title: string; hint: string } {
  const of = actor ? ` de ${actor}` : '';
  const forX = actor ? ` para ${actor}` : '';
  if (c.type === OcgMessageType.SELECT_TRIBUTE) {
    return { title: `Escolha ${c.min === 1 ? '1 tributo' : `${c.min} tributos`}${forX}`, hint: 'Toque nos monstros que brilham.' };
  }
  if (attack) return { title: `Escolha o alvo${of}`, hint: 'Toque no monstro que brilha em vermelho.' };
  const handOnly = c.options.every((o) => o.ref.location === OcgLocation.HAND);
  const one = c.max === 1;
  const title = one ? `Escolha o alvo${of}` : c.min === c.max ? `Escolha ${c.max} alvos${forX}` : `Escolha de ${c.min} a ${c.max} alvos${forX}`;
  const hint = handOnly ? (one ? 'Toque na carta da mão que brilha.' : 'Toque nas cartas da mão que brilham.') : one ? 'Toque na carta que brilha.' : 'Toque nas cartas que brilham.';
  return { title, hint };
}

const PLACE: [number, string][] = [
  [OcgLocation.DECK, 'Deck'], [OcgLocation.GRAVE, 'Cemitério'], [OcgLocation.REMOVED, 'Banida'], [OcgLocation.EXTRA, 'Extra Deck'],
  [OcgLocation.HAND, 'Mão'], [OcgLocation.MZONE, 'Campo'], [OcgLocation.SZONE, 'Campo'], [OcgLocation.OVERLAY, 'Material'],
];
/** Legenda de uma carta da lista: de onde ela vem ("Seu cemitério", "Deck do oponente"). */
export function placeCaption(ref: CardRef): string {
  const place = PLACE.find(([mask]) => ref.location & mask)?.[1] ?? '';
  if (ref.controller === 0) return place === 'Cemitério' ? 'Seu cemitério' : place === 'Deck' ? 'Seu Deck' : place;
  return `${place} do oponente`;
}
