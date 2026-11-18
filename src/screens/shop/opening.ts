/**
 * A encenação da abertura de pacotes, pura (`PackOpeningSequence`/`PackReveal` do nativo). A compra já gravou as
 * cartas: aqui só se decide o que está virado, qual pacote está na tela e que som cada passo toca.
 */
import type { Rarity } from '../../campaign/data/types';
import type { PackOpening, Pull } from '../../campaign/packs';

export type OpeningSound = 'tear' | 'flip' | 'rare';
export type Phase = 'sealed' | 'torn' | 'summary';
export interface OpeningState { index: number; phase: Phase; flipped: boolean[] }
export interface Step { state: OpeningState; sounds: OpeningSound[] }

const isShiny = (r: Rarity) => r === 'super' || r === 'ultra';
const fresh = (index: number, o: PackOpening): OpeningState => ({ index, phase: 'sealed', flipped: o.pulls.map(() => false) });

export const startOpening = (openings: PackOpening[]): OpeningState => fresh(0, openings[0]);

/** Rasga o pacote da vez: as cartas aparecem de verso. */
export function tear(s: OpeningState): Step {
  return s.phase === 'sealed' ? { state: { ...s, phase: 'torn' }, sounds: ['tear'] } : { state: s, sounds: [] };
}

/** Vira a carta `i` (se ainda estiver de verso). */
export function flip(s: OpeningState, openings: PackOpening[], i: number): Step {
  if (s.phase !== 'torn' || s.flipped[i] !== false) return { state: s, sounds: [] };
  const flipped = s.flipped.map((f, k) => f || k === i);
  const shiny = isShiny(openings[s.index].pulls[i].rarity);
  return { state: { ...s, flipped }, sounds: shiny ? ['flip', 'rare'] : ['flip'] };
}

/** "Revelar tudo": vira as que faltam (um som de virar e, se alguma for Super/Ultra, um de rara). */
export function revealAll(s: OpeningState, openings: PackOpening[]): Step {
  if (s.phase !== 'torn') return { state: s, sounds: [] };
  const hidden = openings[s.index].pulls.filter((_, k) => !s.flipped[k]);
  if (!hidden.length) return { state: s, sounds: [] };
  const sounds: OpeningSound[] = hidden.some((p) => isShiny(p.rarity)) ? ['flip', 'rare'] : ['flip'];
  return { state: { ...s, flipped: s.flipped.map(() => true) }, sounds };
}

export const allFlipped = (s: OpeningState) => s.phase === 'torn' && s.flipped.every(Boolean);
export const isLast = (s: OpeningState, openings: PackOpening[]) => s.index >= openings.length - 1;

/** "Próximo pacote" (ou o resumo, depois do último de vários). Com um pacote só, não há resumo. */
export function next(s: OpeningState, openings: PackOpening[]): Step {
  if (!isLast(s, openings)) return { state: fresh(s.index + 1, openings[s.index + 1]), sounds: [] };
  return { state: { ...s, phase: 'summary' }, sounds: [] };
}

/** "Abrir todos": pula para o resumo; toca a rara uma vez se ainda faltava aparecer alguma Ultra. */
export function skipAll(s: OpeningState, openings: PackOpening[]): Step {
  const pending: Pull[] = openings.flatMap((o, k) =>
    k < s.index ? [] : k > s.index || s.phase === 'sealed' ? o.pulls : o.pulls.filter((_, i) => !s.flipped[i]));
  return { state: { ...s, phase: 'summary' }, sounds: pending.some((p) => p.rarity === 'ultra') ? ['rare'] : [] };
}

/** Cartas que entraram na coleção pela primeira vez (cada carta conta uma vez, mesmo repetida na caixa). */
export const newCount = (openings: PackOpening[]) =>
  new Set(openings.flatMap((o) => o.pulls.filter((p) => p.isNew).map((p) => p.id))).size;

const RANK: Record<Rarity, number> = { ultra: 0, super: 1, rare: 2, common: 3 };
/** O resumo: da raridade mais alta para a mais baixa e, no empate, na ordem em que saíram. */
export const summaryOrder = (openings: PackOpening[]): Pull[] =>
  openings.flatMap((o) => o.pulls).map((p, order) => ({ p, order }))
    .sort((a, b) => RANK[a.p.rarity] - RANK[b.p.rarity] || a.order - b.order).map((x) => x.p);

export const anyUltra = (openings: PackOpening[]) => openings.some((o) => o.pulls.some((p) => p.rarity === 'ultra'));
