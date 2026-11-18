import { OcgLocation } from 'ocgcore-wasm';
import type { DuelTrack } from './track';
import { faceDown, inAttack, isResponder, isSpell, type BoardView, type SeenCard } from './view';

/**
 * Pesos da avaliação do tabuleiro (a única fonte deles). Unidade: pontos de LP. Calibrados pela
 * `proto/difficulty.ts`.
 */
export const EVAL = {
  /** Cada carta em campo, além da força. */
  card: 350,
  /** Cada carta na mão. */
  hand: 300,
  /** Monstro virado do oponente, sem olhar (perfil comum). */
  hiddenMonster: 1300,
  /** Magia/Armadilha virada do oponente, sem olhar. */
  hiddenSpellTrap: 500,
  /** Armadilha ou Rápida própria baixada (pronta para responder). */
  setResponder: 500,
  /** Magia comum baixada (não responde a nada). */
  setSpell: 100,
  /** Magia/Armadilha com a face para cima (Contínua, Equipamento, Campo). */
  faceUpSpell: 250,
  /** Monstro em defesa vale esta fração do maior entre ATK e DEF. */
  defense: 0.8,
  /** Abaixo deste LP, cada ponto perdido pesa mais. */
  lowLp: 2000,
  lowLpExtra: 0.75,
  /** Risco por Magia/Armadilha virada do oponente, sobre o valor de cada monstro que atacou (perfil comum). */
  risk: 0.12,
  riskMax: 0.5,
} as const;

export const WIN = 1e9;

function monsterValue(c: SeenCard, hidden: boolean) {
  if (hidden) return EVAL.hiddenMonster;
  const s = inAttack(c) ? c.attack : Math.max(c.attack, c.defense) * EVAL.defense;
  return EVAL.card + s;
}

function spellTrapValue(c: SeenCard, hidden: boolean) {
  if (hidden) return EVAL.hiddenSpellTrap;
  if (faceDown(c)) return isResponder(c.type) ? EVAL.setResponder : isSpell(c.type) ? EVAL.setSpell : EVAL.setResponder;
  return EVAL.faceUpSpell;
}

/** Valor de um lado. `hide`: o lado é o oponente e a CPU não pode olhar o que está virado. */
function sideValue(v: BoardView, p: number, hide: boolean) {
  const s = v[p];
  let total = s.hand.length * EVAL.hand;
  for (const c of s.mzone) total += monsterValue(c, hide && faceDown(c));
  for (const c of s.szone) total += spellTrapValue(c, hide && faceDown(c));
  return total;
}

const lpValue = (lp: number) => lp + (lp < EVAL.lowLp ? -(EVAL.lowLp - lp) * EVAL.lowLpExtra : 0);

/**
 * Nota do tabuleiro do ponto de vista de `me` (maior é melhor). `peek`: pode ler o que o oponente esconde (chefe). No
 * perfil comum, do lado do oponente só entra o público: LP, monstros com a face para cima, quantas cartas viradas e
 * quantas na mão.
 */
export function evaluate(v: BoardView, track: DuelTrack, me: number, peek: boolean) {
  const opp = 1 - me;
  if (track.winner === me) return WIN;
  if (track.winner === opp) return -WIN;
  if (track.lp[opp] <= 0 && track.lp[me] > 0) return WIN;
  if (track.lp[me] <= 0 && track.lp[opp] > 0) return -WIN;
  return lpValue(track.lp[me]) - lpValue(track.lp[opp]) + sideValue(v, me, false) - sideValue(v, opp, !peek);
}

/** Magias/Armadilhas viradas do oponente (o que a CPU honesta teme sem saber o que é). */
export const hiddenSpellTraps = (v: BoardView, me: number) =>
  v[1 - me].szone.filter((c) => faceDown(c) && c.location === OcgLocation.SZONE).length;

/**
 * Desconto pelo risco das viradas do oponente, sobre os ataques declarados por `me` na continuação: cada um perde uma
 * fração do valor do atacante (no começo da decisão), maior com mais cartas viradas.
 */
export function attackRisk(before: BoardView, attacks: DuelTrack['attacks'], me: number) {
  const n = hiddenSpellTraps(before, me);
  if (!n) return 0;
  const frac = Math.min(EVAL.riskMax, n * EVAL.risk);
  let total = 0;
  for (const a of attacks) {
    if (a.controller !== me) continue;
    const c = before[me].mzone.find((x) => x.sequence === a.sequence);
    total += (c ? monsterValue(c, false) : EVAL.card) * frac;
  }
  return total;
}
