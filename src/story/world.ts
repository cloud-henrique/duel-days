import type { Chapter } from './runner';
import { MAX_HEARTS, type Progress } from './progress';
import { bakuraScenes, joeyScenes, kaibaScenes } from './content';

export interface Location { id: string; name: string; blurb: string; bg: string; chars: string[] }
export interface Scene {
  id: string;
  char: string;
  location: string;
  /** Corações mínimos para a cena aparecer. */
  requires?: number;
  /** Só acontece uma vez. */
  once?: boolean;
  chapter: Chapter;
}

export const LOCATIONS: Location[] = [
  { id: 'escola', name: 'Colégio Domino', blurb: 'O corredor na hora do intervalo.', bg: 'linear-gradient(180deg,#2f4f8a,#0f2350 55%,#050c1f)', chars: ['joey_wheeler'] },
  { id: 'parque', name: 'Parque', blurb: 'Quieto, quase vazio ao entardecer.', bg: 'linear-gradient(180deg,#14275a,#0a1a3a 55%,#050c1f)', chars: ['bakura'] },
  { id: 'kaibacorp', name: 'Kaiba Corp', blurb: 'Vidro, aço e uma sala de duelos.', bg: 'linear-gradient(180deg,#2d3550,#141a2e 55%,#05070f)', chars: ['seto_kaiba'] },
];

export const SCENES: Scene[] = [
  ...joeyScenes('escola'), ...bakuraScenes('parque'), ...kaibaScenes('kaibacorp'),
];

export const sceneById = (id: string) => SCENES.find((s) => s.id === id)!;
export const locationOf = (id: string) => LOCATIONS.find((l) => l.id === id)!;

/** Primeira cena elegível do personagem, na ordem declarada (a última é sempre a revanche repetível). */
export function pickScene(char: string, p: Progress): Scene {
  const hearts = p.hearts[char] ?? 0;
  const found = SCENES.find((s) => s.char === char && (s.requires ?? 0) <= hearts && !(s.once && p.seen.includes(s.id)));
  if (!found) throw new Error(`personagem sem cena elegível: ${char}`);
  return found;
}

export const heartsOf = (p: Progress, char: string) => Math.min(MAX_HEARTS, p.hearts[char] ?? 0);
