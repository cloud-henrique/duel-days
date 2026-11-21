import { OcgDuelMode } from 'ocgcore-wasm';

/**
 * As regras do duelo do jogo (change speed-duel): Speed Duel, sem Skills. A fonte única para o motor, a tela, o editor e
 * a campanha; nada fora daqui fixa LP, mão inicial, colunas ou tamanho do deck.
 */
export const FORMAT = {
  /** Modo do ocgcore: 3 colunas no campo e sem Main Phase 2. */
  mode: OcgDuelMode.MODE_SPEED,
  lp: 4000,
  hand: 4,
  /** Sequências de `mzone`/`szone` em jogo no modo de 3 colunas (as do meio). */
  columns: [1, 2, 3] as readonly number[],
  mainMin: 20,
  mainMax: 30,
  extraMax: 5,
  maxCopies: 3,
} as const;

export const START_LPS: [number, number] = [FORMAT.lp, FORMAT.lp];
