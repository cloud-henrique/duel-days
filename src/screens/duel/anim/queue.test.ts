import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Beat, Board, Loc, Step } from '../../../engine/protocol';
import { groupSteps, runSteps, speedFactor, type QueueOpts } from './queue';
import { PACING } from './pacing';

const at: Loc = { p: 1, zone: 'mzone', seq: 0 };
const board = (turn: number) => ({ turn } as Board);
const summon: Beat = { k: 'summon', from: { p: 1, zone: 'hand', seq: 0 }, to: at, code: 1, how: 'normal' };
const destroy = (seq: number): Beat => ({ k: 'move', from: { ...at, seq }, to: { p: 1, zone: 'grave', seq: 0 }, code: 1, why: 'destroy' });
const lp: Beat = { k: 'lp', p: 0, delta: -500, why: 'damage' };
const attack: Beat = { k: 'attack', from: at, to: null, code: 1 };

/** Roda a fila com relógio falso e registra cada chamada com o instante em ms. */
function harness(over: Partial<QueueOpts> = {}) {
  const log: string[] = [];
  const t0 = Date.now();
  const now = () => Date.now() - t0;
  const opts: QueueOpts = {
    speed: 'normal',
    play: (g, f) => log.push(`${now()} play ${g.map((s) => s.beat.k).join('+')} x${f}`),
    announce: (s) => log.push(`${now()} announce ${s.beat.k}`),
    apply: (b) => log.push(`${now()} apply ${b.turn}`),
    ...over,
  };
  return { log, opts };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

/** Avança o relógio até a fila terminar. */
async function finish(p: Promise<void>) {
  let done = false;
  void p.then(() => { done = true; });
  for (let i = 0; i < 100 && !done; i++) await vi.advanceTimersByTimeAsync(50);
  expect(done).toBe(true);
}

describe('groupSteps', () => {
  it('junta os steps `together` ao anterior', () => {
    const g = groupSteps([{ beat: destroy(0) }, { beat: destroy(1), together: true }, { beat: lp }]);
    expect(g.map((x) => x.length)).toEqual([2, 1]);
  });
});

describe('speedFactor', () => {
  it('normal 1×, rápida 0,5×, toque 0,25× (sem deixar mais lento)', () => {
    expect(speedFactor('normal', false)).toBe(1);
    expect(speedFactor('fast', false)).toBe(0.5);
    expect(speedFactor('normal', true)).toBe(0.25);
    expect(speedFactor('fast', true)).toBe(0.25);
  });
});

describe('runSteps', () => {
  it('ordem, com o tabuleiro aplicado depois da trava de cada play', async () => {
    const { log, opts } = harness();
    await finish(runSteps([{ beat: summon, board: board(1) }, { beat: attack }, { beat: lp, board: board(2) }], opts));
    const S = PACING.summon.block, A = PACING.attack.block;
    expect(log).toEqual([
      '0 announce summon', '0 play summon x1', `${S} apply 1`,
      `${S} announce attack`, `${S} play attack x1`,
      `${S + A} announce lp`, `${S + A} play lp x1`, `${S + A} apply 2`,
    ]);
  });

  it('a CPU pensa antes do step marcado `think`', async () => {
    const { log, opts } = harness();
    await finish(runSteps([{ beat: summon, think: true, board: board(1) }], opts));
    expect(log[0]).toBe(`${PACING.think.block} announce summon`);
  });

  it('rápida: metade dos tempos', async () => {
    const { log, opts } = harness({ speed: 'fast' });
    await finish(runSteps([{ beat: summon, think: true, board: board(1) }], opts));
    expect(log).toEqual([
      `${PACING.think.block / 2} announce summon`, `${PACING.think.block / 2} play summon x0.5`,
      `${(PACING.think.block + PACING.summon.block) / 2} apply 1`,
    ]);
  });

  it('o toque no meio da fila acelera os grupos seguintes', async () => {
    let hurry = false;
    const { log, opts } = harness({ hurried: () => hurry, play: (g, f) => { log.push(`play x${f}`); if (g[0].beat.k === 'summon') hurry = true; } });
    await finish(runSteps([{ beat: summon }, { beat: attack }, { beat: destroy(0) }], opts));
    expect(log.filter((l) => l.startsWith('play'))).toEqual(['play x1', 'play x0.25', 'play x0.25']);
  });

  it('desligada: sem play nem espera, narrador e tabuleiros na ordem', async () => {
    const { log, opts } = harness({ speed: 'off' });
    await runSteps([{ beat: summon, think: true, board: board(1) }, { beat: lp, board: board(2) }], opts);
    expect(log).toEqual(['0 announce summon', '0 apply 1', '0 announce lp', '0 apply 2']);
  });

  it('beats simultâneos: um play só, com a maior trava', async () => {
    const { log, opts } = harness();
    await finish(runSteps([{ beat: destroy(0) }, { beat: destroy(1), together: true }, { beat: lp, together: true, board: board(3) }], opts));
    expect(log).toEqual([
      '0 announce move', '0 announce move', '0 announce lp', '0 play move+move+lp x1', `${PACING.destroy.block} apply 3`,
    ]);
  });

  it('cancelar no meio aplica o último tabuleiro e para de tocar', async () => {
    const ctl = new AbortController();
    const { log, opts } = harness({ signal: ctl.signal });
    const p = runSteps([{ beat: summon, board: board(1) }, { beat: attack }, { beat: lp, board: board(9) }], opts);
    await vi.advanceTimersByTimeAsync(100);
    ctl.abort();
    await finish(p);
    expect(log).toEqual(['0 announce summon', '0 play summon x1', '100 apply 9']);
  });
});
