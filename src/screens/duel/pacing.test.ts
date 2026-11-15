import { describe, expect, it } from 'vitest';
import type { Board, Frame } from '../../engine/protocol';
import { CPU_THINK_MS, SHOWCASE_MS, isOpponentStep, playbackDelays } from './pacing';

const board = (turnPlayer: number) => ({ turnPlayer } as Board);
const frame = (turnPlayer: number, showsBy: number[] = []): Frame => ({ board: board(turnPlayer), events: ['x'], shows: showsBy.map((controller) => ({ code: 1, controller })) });

describe('ritmo da encenação', () => {
  it('passo da CPU: no turno dela ou uma resposta dela no turno do jogador', () => {
    expect(isOpponentStep(frame(1))).toBe(true);
    expect(isOpponentStep(frame(0, [1]))).toBe(true);
    expect(isOpponentStep(frame(0, [0]))).toBe(false);
  });

  it('jogadas do próprio jogador não esperam', () => {
    expect(playbackDelays([frame(0), frame(0)])).toEqual([0, 0, 0]);
  });

  it('a CPU pensa antes de cada jogada', () => {
    expect(playbackDelays([frame(1), frame(1)])).toEqual([CPU_THINK_MS, CPU_THINK_MS, CPU_THINK_MS]);
  });

  it('o passo seguinte a um da CPU espera o resultado ser visto, mesmo sendo do jogador', () => {
    expect(playbackDelays([frame(1), frame(0)])).toEqual([CPU_THINK_MS, CPU_THINK_MS, 0]);
  });

  it('depois de uma ativação, o próximo passo espera o destaque', () => {
    expect(playbackDelays([frame(1, [1]), frame(1)])).toEqual([CPU_THINK_MS, CPU_THINK_MS + SHOWCASE_MS, CPU_THINK_MS]);
    expect(playbackDelays([frame(0, [0])])).toEqual([0, SHOWCASE_MS]);
  });
});
