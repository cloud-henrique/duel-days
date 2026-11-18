import { OcgLocation, OcgPosition, OcgQueryFlags, OcgType } from 'ocgcore-wasm';
import type { DuelSession } from './session';

/** Uma carta como a CPU a enxerga: valores atuais do motor (com equipamentos e campo já aplicados). */
export interface SeenCard {
  code: number; controller: 0 | 1; location: number; sequence: number;
  position: number; type: number; attack: number; defense: number; level: number;
}
export interface SideView { mzone: SeenCard[]; szone: SeenCard[]; hand: SeenCard[]; grave: number; deck: number }
export type BoardView = [SideView, SideView];

// Sem `TYPE`: o leitor do `ocgcore-wasm` se perde com essa flag (devolve nulo e desalinha o resto). O tipo vem da base.
const FLAGS = (OcgQueryFlags.CODE | OcgQueryFlags.POSITION | OcgQueryFlags.ATTACK | OcgQueryFlags.DEFENSE
  | OcgQueryFlags.LEVEL) as OcgQueryFlags;
/** Tipo de cada carta pelo código (o `CardRecord` serve). */
export type TypeDb = Record<string, { type: number }>;
/** ATK/DEF "?" (−2) chegam sem sinal: o "?" vale 0 para a CPU. */
const stat = (v: number | undefined) => Math.max(0, (v ?? 0) | 0);

function cards(s: DuelSession, p: 0 | 1, location: OcgLocation, db?: TypeDb): SeenCard[] {
  const out: SeenCard[] = [];
  s.core.duelQueryLocation(s.handle, { flags: FLAGS, controller: p, location }).forEach((c, sequence) => {
    if (!c || !c.code) return;
    out.push({
      code: c.code, controller: p, location, sequence, position: c.position ?? 0, type: db?.[String(c.code)]?.type ?? 0,
      attack: stat(c.attack), defense: stat(c.defense), level: c.level ?? 0,
    });
  });
  return out;
}

/** O tabuleiro inteiro (inclusive o que está escondido: quem usa decide o que pode ler). */
export function boardView(s: DuelSession, db?: TypeDb): BoardView {
  const side = (p: 0 | 1): SideView => ({
    mzone: cards(s, p, OcgLocation.MZONE, db),
    // Zonas 0-4 e a de campo (5); as de pêndulo não existem no MR1.
    szone: cards(s, p, OcgLocation.SZONE, db),
    hand: cards(s, p, OcgLocation.HAND, db),
    grave: s.core.duelQueryCount(s.handle, p, OcgLocation.GRAVE),
    deck: s.core.duelQueryCount(s.handle, p, OcgLocation.DECK),
  });
  return [side(0), side(1)];
}

export const faceDown = (c: { position: number }) => (c.position & OcgPosition.FACEDOWN) !== 0;
export const inAttack = (c: { position: number }) => (c.position & OcgPosition.ATTACK) !== 0;
export const isMonster = (t: number) => (t & OcgType.MONSTER) !== 0;
export const isTrap = (t: number) => (t & OcgType.TRAP) !== 0;
export const isSpell = (t: number) => (t & OcgType.SPELL) !== 0;
/** Vale como "pronta para responder": Armadilha ou Magia Rápida. */
export const isResponder = (t: number) => isTrap(t) || (isSpell(t) && (t & OcgType.QUICKPLAY) !== 0);
