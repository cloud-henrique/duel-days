/**
 * Qual Magia de Campo pinta o tapete (como no Tag Force): a última ativada, enquanto continuar com a face para cima na
 * zona de Campo de quem a ativou; senão, a que estiver ativa (a do jogador primeiro, depois a do oponente).
 */
import { OcgPosition } from 'ocgcore-wasm';
import type { Board } from '../../engine/protocol';

/** Sequência da zona de Campo dentro das zonas de Magia/Armadilha (MR1). */
export const FIELD_SEQ = 5;

export interface FieldPlayed { code: number; p: 0 | 1 }

const faceUpField = (b: Board, p: 0 | 1) => {
  const c = b.players[p].szone[FIELD_SEQ];
  return c && c.code && (c.position & OcgPosition.FACEUP) !== 0 ? c.code : null;
};

export function fieldBackdrop(board: Board, last: FieldPlayed | null): number | null {
  if (last && faceUpField(board, last.p) === last.code) return last.code;
  return faceUpField(board, 0) ?? faceUpField(board, 1);
}
