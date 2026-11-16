import { describe, expect, it } from 'vitest';
import type { Beat, Step } from '../../engine/protocol';
import { CPU_THINK_MS, SHOWCASE_MS, playbackDelays } from './pacing';

const turn: Beat = { k: 'turn', p: 1, n: 2 };
const act = (p: 0 | 1): Beat => ({ k: 'activate', at: { p, zone: 'szone', seq: 0 }, code: 1, p });
const step = (beat: Beat, think = false): Step => ({ beat, ...(think ? { think: true } : {}) });

describe('ritmo da encenação', () => {
  it('jogadas do próprio jogador não esperam', () => {
    expect(playbackDelays([step(turn), step(turn)])).toEqual([0, 0, 0]);
  });

  it('a CPU pensa antes de cada jogada, e o resultado final espera a última ser vista', () => {
    expect(playbackDelays([step(turn, true), step(turn), step(turn, true)])).toEqual([CPU_THINK_MS, 0, CPU_THINK_MS, CPU_THINK_MS]);
  });

  it('depois de uma ativação, o próximo passo espera o destaque', () => {
    expect(playbackDelays([step(act(1), true), step(turn, true)])).toEqual([CPU_THINK_MS, CPU_THINK_MS + SHOWCASE_MS, CPU_THINK_MS]);
    expect(playbackDelays([step(act(0))])).toEqual([0, SHOWCASE_MS]);
  });

  it('sem steps, o resultado sai na hora', () => {
    expect(playbackDelays([])).toEqual([0]);
  });
});
