import { describe, expect, it } from 'vitest';
import type { Beat, Loc } from '../../../engine/protocol';
import { effectFor, type EffectKind, type Sound } from './effects';
import { MAX_BLOCK_MS, PACING } from './pacing';

const at: Loc = { p: 0, zone: 'mzone', seq: 0 };
const sz: Loc = { p: 1, zone: 'szone', seq: 1 };
const gy: Loc = { p: 0, zone: 'grave', seq: 0 };
const move = (why: Extract<Beat, { k: 'move' }>['why']): Beat => ({ k: 'move', from: at, to: gy, code: 1, why });

/** Um caso por beat (e por variação que muda o efeito): [beat, efeito, trava, som]. */
const CASES: [string, Beat, EffectKind, number, Sound | null][] = [
  ['compra', { k: 'draw', p: 0, codes: [1] }, 'flight', PACING.draw.block, 'draw'],
  ['invocação', { k: 'summon', from: at, to: at, code: 1, how: 'normal' }, 'summon', PACING.summon.block, 'summon'],
  ['baixa', { k: 'set', from: at, to: at }, 'set', PACING.set.block, 'set'],
  ['virar', { k: 'pos', at, code: 1, reveal: true, defense: false }, 'reveal', PACING.reveal.block, 'flip'],
  ['mudar posição', { k: 'pos', at, code: 1, reveal: false, defense: true }, 'turn', PACING.pos.block, null],
  ['ativar Magia/Armadilha', { k: 'activate', at: sz, code: 1, p: 1 }, 'splash', PACING.activate.block, 'activate'],
  ['efeito de monstro', { k: 'activate', at, code: 1, p: 0 }, 'splash', PACING.activate.blockMonster, 'activate'],
  ['corrente de 2', { k: 'chainSolve', link: 2, of: 2, result: 'ok' }, 'chain', PACING.chain.block, null],
  ['corrente de 1', { k: 'chainSolve', link: 1, of: 1, result: 'ok' }, 'none', 0, null],
  ['ataque', { k: 'attack', from: at, to: null, code: 1 }, 'attack', PACING.attack.block, 'attack'],
  ['dano', { k: 'lp', p: 1, delta: -500, why: 'damage' }, 'lp', 0, 'damage'],
  ['custo', { k: 'lp', p: 0, delta: -1000, why: 'cost' }, 'lp', 0, 'damage'],
  ['cura', { k: 'lp', p: 0, delta: 300, why: 'recover' }, 'lp', 0, 'heal'],
  ['destruição', move('destroy'), 'shatter', PACING.destroy.block, 'destroy'],
  ['cemitério', move('grave'), 'flight', PACING.move.block, null],
  ['mão', move('hand'), 'flight', PACING.move.block, 'draw'],
  ['deck', move('deck'), 'flight', PACING.move.block, null],
  ['outro', move('other'), 'flight', PACING.move.block, null],
  ['banir', move('banish'), 'banish', PACING.banish.block, 'destroy'],
  ['equipar', { k: 'equip', from: sz, to: sz, target: at, code: 1 }, 'equip', PACING.equip.block, 'activate'],
  ['moeda', { k: 'toss', what: 'coin', p: 0, results: [1] }, 'toss', PACING.toss.block, 'coin'],
  ['dado', { k: 'toss', what: 'dice', p: 1, results: [3] }, 'toss', PACING.toss.block, 'coin'],
  ['turno', { k: 'turn', p: 1, n: 2 }, 'none', 0, 'endTurn'],
  ['fase', { k: 'phase', phase: 4 }, 'none', 0, null],
  ['vitória', { k: 'win', p: 0 }, 'none', 0, 'victory'],
  ['derrota', { k: 'win', p: 1 }, 'none', 0, 'defeat'],
];

describe('effectFor', () => {
  it.each(CASES)('%s', (_, beat, kind, block, sound) => {
    expect(effectFor(beat)).toMatchObject({ kind, block, sound });
  });

  it('ataque traz a tremida do PACING; os outros não tremem', () => {
    expect(effectFor({ k: 'attack', from: at, to: at, code: 1 }).shake).toEqual(PACING.attack.shake);
    for (const [, b] of CASES) if (b.k !== 'attack') expect(effectFor(b).shake).toEqual([]);
  });

  describe('reduzir movimento', () => {
    const reduced = (b: Beat) => effectFor(b, { reducedMotion: true });

    it('voo, invocação, baixa, giro 3D, quebra e equipamento viram fade curto', () => {
      for (const name of ['compra', 'invocação', 'baixa', 'virar', 'destruição', 'cemitério', 'equipar']) {
        const b = CASES.find(([n]) => n === name)![1];
        expect(reduced(b)).toMatchObject({ kind: 'fade', durations: { fade: PACING.fade.duration } });
        expect(reduced(b).block).toBeLessThanOrEqual(PACING.fade.block);
      }
    });

    it('ataque: sem avanço nem tremida, só o flash no alvo; o som continua', () => {
      expect(reduced({ k: 'attack', from: at, to: at, code: 1 })).toMatchObject({ kind: 'flash', shake: [], sound: 'attack' });
    });

    it('destaque sem escala', () => {
      expect(reduced({ k: 'activate', at: sz, code: 1, p: 1 })).toMatchObject({ kind: 'splash', scaleFrom: 1 });
    });

    it('moeda sem giro, mas com tempo para ler o resultado', () => {
      expect(reduced({ k: 'toss', what: 'coin', p: 0, results: [0] })).toMatchObject({ kind: 'fade', block: PACING.toss.block, durations: { caption: PACING.toss.caption } });
    });

    it('nenhum efeito treme e os sons não mudam', () => {
      for (const [, b] of CASES) {
        expect(reduced(b).shake).toEqual([]);
        expect(reduced(b).sound).toBe(effectFor(b).sound);
      }
    });
  });
});

describe('PACING', () => {
  it(`nenhuma trava passa de ${MAX_BLOCK_MS}ms`, () => {
    const blocks = Object.entries(PACING).flatMap(([name, v]) =>
      Object.entries(v).filter(([k]) => k.startsWith('block')).map(([k, ms]) => [`${name}.${k}`, ms as number] as const));
    expect(blocks.length).toBeGreaterThan(10);
    for (const [name, ms] of blocks) expect(ms, name).toBeLessThanOrEqual(MAX_BLOCK_MS);
  });

  it('nenhum efeito trava mais que o teto, com ou sem reduzir movimento', () => {
    for (const [, b] of CASES) for (const reducedMotion of [false, true]) expect(effectFor(b, { reducedMotion }).block).toBeLessThanOrEqual(MAX_BLOCK_MS);
  });
});
