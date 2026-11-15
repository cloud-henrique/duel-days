import type { OcgMessage, OcgResponse } from 'ocgcore-wasm';

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

export type ToWorker = { t: 'start'; seed: number; deck: number[]; base: string } | { t: 'respond'; response: OcgResponse };
export type FromWorker =
  | { t: 'ready'; version: [number, number]; loadMs: number }
  | { t: 'prompt'; msg: OcgMessage; board: Board; events: string[] }
  | { t: 'end'; winner: number; board: Board; events: string[] }
  | { t: 'error'; text: string };
