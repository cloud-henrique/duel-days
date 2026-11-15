import type { OcgMessage, OcgResponse } from 'ocgcore-wasm';
import type { DeckList } from './session';

export interface BoardCard { code: number; position: number; attack?: number; defense?: number }
export interface PlayerBoard {
  lp: number;
  deck: number;
  hand: BoardCard[];
  mzone: (BoardCard | null)[];
  szone: (BoardCard | null)[];
  grave: BoardCard[];
}
export interface Board { players: [PlayerBoard, PlayerBoard]; turn: number; turnPlayer: number; phase: number }

export type ToWorker =
  | { t: 'start'; seed: number; mine: DeckList; foe: DeckList; base: string }
  | { t: 'respond'; response: OcgResponse }
  /** Liga/desliga a resposta automática "não" às correntes opcionais do jogador. */
  | { t: 'autoPass'; value: boolean };
export type FromWorker =
  | { t: 'ready'; version: [number, number]; loadMs: number }
  | { t: 'prompt'; msg: OcgMessage; board: Board; events: string[] }
  | { t: 'end'; winner: number; board: Board; events: string[] }
  | { t: 'error'; text: string };

/** Marca a mensagem de aviso (não é erro): ex. jogada inválida. */
export const RETRY_NOTICE = 'Jogada inválida, tente de novo.';
