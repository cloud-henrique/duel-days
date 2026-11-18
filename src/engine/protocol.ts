import type { OcgMessage, OcgResponse } from 'ocgcore-wasm';
import type { DeckList } from './session';
import type { CpuKind } from './search';

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

export type Side = 0 | 1;
/** Lugar de uma carta, do ponto de vista da tela (`none`: fora do jogo, ex. ficha criada ou removida). */
export type Zone = 'deck' | 'hand' | 'mzone' | 'szone' | 'grave' | 'removed' | 'extra' | 'none';
export interface Loc { p: Side; zone: Zone; seq: number }
/** Motivo de um movimento, para escolher a animação (quebra, voo, fade). */
export type MoveWhy = 'destroy' | 'grave' | 'banish' | 'hand' | 'deck' | 'other';
export type LpWhy = 'damage' | 'recover' | 'cost';

/**
 * Um acontecimento visível do duelo: um tipo por acontecimento, sem sobreposição (invocar não é também um `move`).
 * É a única fonte do texto do narrador (`beatText`) e das animações.
 */
export type Beat =
  | { k: 'draw'; p: Side; codes: number[] }
  | { k: 'summon'; from: Loc; to: Loc; code: number; how: 'normal' | 'special' | 'flip' }
  | { k: 'set'; from: Loc; to: Loc }
  | { k: 'move'; from: Loc; to: Loc; code: number; why: MoveWhy }
  /** `reveal`: virou de face para cima; `defense`: terminou em defesa. */
  | { k: 'pos'; at: Loc; code: number; reveal: boolean; defense: boolean }
  | { k: 'activate'; at: Loc; code: number; p: Side }
  /** `link`: elo que resolve (ou foi negado/anulado); `of`: tamanho da corrente. */
  | { k: 'chainSolve'; link: number; of: number; result: 'ok' | 'negated' | 'disabled' }
  | { k: 'attack'; from: Loc; to: Loc | null; code: number }
  | { k: 'lp'; p: Side; delta: number; why: LpWhy }
  | { k: 'equip'; from: Loc; to: Loc; target: Loc; code: number }
  | { k: 'toss'; what: 'coin' | 'dice'; p: Side; results: number[] }
  | { k: 'turn'; p: Side; n: number }
  | { k: 'phase'; phase: number }
  | { k: 'win'; p: number };
/**
 * Um beat na fila da tela.
 * - `board`: o tabuleiro depois dele; só no último beat de cada passo do motor (a consulta só vê o fim do passo).
 * - `together`: toca junto com o anterior (ex.: várias destruições do mesmo efeito).
 * - `think`: primeiro beat depois de uma jogada da CPU; a tela espera o tempo de "pensar" antes dele.
 */
export interface Step { beat: Beat; board?: Board; together?: boolean; think?: boolean }

export type ToWorker =
  /** `cpu`: perfil da CPU (o chefe do tier joga como `chefe`); sem ele, `comum`. */
  | { t: 'start'; seed: number; mine: DeckList; foe: DeckList; base: string; debug?: boolean; cpu?: CpuKind }
  | { t: 'respond'; response: OcgResponse }
  /** Liga/desliga a resposta automática "não" às correntes opcionais do jogador. */
  | { t: 'autoPass'; value: boolean }
  | { t: 'ping'; n: number };
export type FromWorker =
  | { t: 'ready'; version: [number, number]; loadMs: number }
  /** `steps`: o que aconteceu desde a última mensagem, em ordem; `board`: o tabuleiro final; `notice`: aviso (ex.: jogada inválida). */
  | { t: 'prompt'; msg: OcgMessage; board: Board; steps: Step[]; notice?: string }
  | { t: 'end'; winner: number; board: Board; steps: Step[] }
  /**
   * Parte dos steps, enviada antes de cada decisão da CPU: a tela encena enquanto ela pensa. Também serve de sinal de
   * vida para o vigia (pode vir vazia).
   */
  | { t: 'steps'; steps: Step[] }
  | { t: 'error'; text: string }
  | { t: 'debug'; text: string }
  | { t: 'pong'; n: number };

/** Marca a mensagem de aviso (não é erro): ex. jogada inválida. */
export const RETRY_NOTICE = 'Jogada inválida, tente de novo.';
