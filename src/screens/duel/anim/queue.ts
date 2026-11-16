/**
 * Fila de encenação: toca os steps do motor em ordem, com as travas do `PACING`. É pura de DOM e de React: a animação
 * (`play`), o narrador (`announce`) e o tabuleiro (`apply`) são injetados, e o relógio também (`wait`), o que permite
 * testá-la com relógio falso.
 *
 * Para cada grupo (um step mais os seguintes marcados `together`):
 * 1. se o primeiro step tem `think`, espera a CPU "pensar";
 * 2. anuncia cada step (narrador, som) e dispara `play` do grupo;
 * 3. espera a maior trava do grupo;
 * 4. aplica o tabuleiro de cada step que tiver um.
 *
 * Os tempos são multiplicados pelo fator de velocidade, lido antes de cada grupo (o toque para acelerar vale do grupo
 * seguinte em diante). Com `off`, nada é animado nem esperado: só o narrador e os tabuleiros, na ordem.
 */
import type { Board, Step } from '../../../engine/protocol';
import { effectFor } from './effects';
import { PACING } from './pacing';

export type AnimSpeed = 'normal' | 'fast' | 'off';

export interface QueueOpts {
  /** Dispara a animação de um grupo de steps simultâneos (`factor`: multiplicador dos tempos). Não é esperada. */
  play: (group: Step[], factor: number) => void;
  /** Mostra o step no narrador (e toca o som), quando a encenação dele começa. */
  announce: (step: Step) => void;
  /** Aplica um tabuleiro na tela. */
  apply: (board: Board) => void;
  speed: AnimSpeed;
  /** O jogador tocou para acelerar (lido antes de cada grupo). */
  hurried?: () => boolean;
  reducedMotion?: boolean;
  signal?: AbortSignal;
  /** Espera `ms` (injetável para testes); deve terminar cedo se o sinal for abortado. */
  wait?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

/** Espera com `setTimeout`, terminando na hora se o sinal for abortado. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (ms <= 0 || signal?.aborted) { resolve(); return; }
    const id = setTimeout(done, ms);
    function done() { clearTimeout(id); signal?.removeEventListener('abort', done); resolve(); }
    signal?.addEventListener('abort', done, { once: true });
  });
}

/** Divide os steps em grupos simultâneos (um step e os seguintes marcados `together`). */
export function groupSteps(steps: Step[]): Step[][] {
  const groups: Step[][] = [];
  for (const s of steps) {
    if (s.together && groups.length) groups[groups.length - 1].push(s);
    else groups.push([s]);
  }
  return groups;
}

/** Fator dos tempos para a velocidade escolhida e o toque para acelerar. */
export const speedFactor = (speed: Exclude<AnimSpeed, 'off'>, hurried: boolean) =>
  Math.min(PACING.speed[speed], hurried ? PACING.speed.hurry : Infinity);

/** O último tabuleiro de uma lista de steps (ou `null`). */
const lastBoard = (steps: Step[]) => [...steps].reverse().find((s) => s.board)?.board ?? null;

/**
 * Toca os steps. Termina quando a fila acaba ou é cancelada; no cancelamento, aplica o último tabuleiro dos steps (a tela
 * nunca fica num estado intermediário).
 */
export async function runSteps(steps: Step[], opts: QueueOpts): Promise<void> {
  const { play, announce, apply, speed, hurried = () => false, reducedMotion = false, signal, wait = sleep } = opts;
  if (speed === 'off') {
    for (const s of steps) { announce(s); if (s.board) apply(s.board); }
    return;
  }
  const groups = groupSteps(steps);
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (signal?.aborted) break;
    const factor = speedFactor(speed, hurried());
    if (group[0].think) await wait(PACING.think.block * factor, signal);
    if (signal?.aborted) break;
    for (const s of group) announce(s);
    play(group, factor);
    const block = Math.max(...group.map((s) => effectFor(s.beat, { reducedMotion }).block));
    await wait(block * factor, signal);
    if (signal?.aborted) break;
    for (const s of group) if (s.board) apply(s.board);
  }
  if (signal?.aborted) {
    const b = lastBoard(steps);
    if (b) apply(b);
  }
}
