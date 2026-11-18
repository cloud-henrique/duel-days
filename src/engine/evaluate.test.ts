import { describe, expect, it } from 'vitest';
import { OcgLocation, OcgPosition, OcgType } from 'ocgcore-wasm';
import { attackRisk, evaluate, WIN } from './evaluate';
import { DuelTrack } from './track';
import type { BoardView, SeenCard, SideView } from './view';

const m = (p: 0 | 1, attack: number, position: number = OcgPosition.FACEUP_ATTACK, sequence = 0): SeenCard =>
  ({ code: 1, controller: p, location: OcgLocation.MZONE, sequence, position, type: OcgType.MONSTER, attack, defense: 1000, level: 4 });
const s = (p: 0 | 1, code: number, type: number, position: number = OcgPosition.FACEDOWN_DEFENSE): SeenCard =>
  ({ code, controller: p, location: OcgLocation.SZONE, sequence: 0, position, type, attack: 0, defense: 0, level: 0 });
const side = (o: Partial<SideView> = {}): SideView => ({ mzone: [], szone: [], hand: [], grave: 0, deck: 30, ...o });
const board = (a: Partial<SideView>, b: Partial<SideView>): BoardView => [side(a), side(b)];
const lp = (a: number, b: number) => { const t = new DuelTrack(); t.lp = [a, b]; return t; };

describe('evaluate', () => {
  it('vitória e derrota são extremos', () => {
    const t = new DuelTrack(); t.winner = 1;
    expect(evaluate(board({}, {}), t, 1, false)).toBe(WIN);
    expect(evaluate(board({}, {}), t, 0, false)).toBe(-WIN);
  });
  it('mais LP e mais força dão nota maior', () => {
    expect(evaluate(board({}, {}), lp(7000, 8000), 1, false)).toBeGreaterThan(evaluate(board({}, {}), lp(8000, 8000), 1, false));
    const weak = board({}, { mzone: [m(1, 1000)] });
    const strong = board({}, { mzone: [m(1, 1800)] });
    expect(evaluate(strong, lp(8000, 8000), 1, false)).toBeGreaterThan(evaluate(weak, lp(8000, 8000), 1, false));
  });
  it('comum: o que está virado do jogador não muda a nota', () => {
    const a = board({ szone: [s(0, 44095762, OcgType.TRAP)], mzone: [m(0, 2500, OcgPosition.FACEDOWN_DEFENSE)] }, {});
    const b = board({ szone: [s(0, 55144522, OcgType.SPELL)], mzone: [m(0, 300, OcgPosition.FACEDOWN_DEFENSE)] }, {});
    expect(evaluate(a, lp(8000, 8000), 1, false)).toBe(evaluate(b, lp(8000, 8000), 1, false));
    // O chefe vê a diferença.
    expect(evaluate(a, lp(8000, 8000), 1, true)).not.toBe(evaluate(b, lp(8000, 8000), 1, true));
  });
  it('risco: atacar contra viradas custa mais com mais viradas', () => {
    const atk = [{ controller: 1, sequence: 0, target: null }];
    const one = board({ szone: [s(0, 1, OcgType.TRAP)] }, { mzone: [m(1, 1800)] });
    const three = board({ szone: [s(0, 1, OcgType.TRAP), s(0, 2, OcgType.TRAP), s(0, 3, OcgType.TRAP)] }, { mzone: [m(1, 1800)] });
    expect(attackRisk(three, atk, 1)).toBeGreaterThan(attackRisk(one, atk, 1));
    expect(attackRisk(board({}, { mzone: [m(1, 1800)] }), atk, 1)).toBe(0);
  });
});
