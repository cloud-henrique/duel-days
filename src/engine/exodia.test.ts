import { describe, expect, it } from 'vitest';
import { OcgLocation, OcgPosition, OcgType } from 'ocgcore-wasm';
import { rankTargets } from './cpu';
import { evaluate, EVAL } from './evaluate';
import { DuelTrack } from './track';
import { EXODIA_PIECES, type SeenCard, type SideView } from './view';

const [HEAD, ARM] = [...EXODIA_PIECES];
const inHand = (code: number, sequence: number, attack = 200): SeenCard =>
  ({ code, controller: 1, location: OcgLocation.HAND, sequence, position: OcgPosition.FACEUP_ATTACK, type: OcgType.MONSTER, attack, defense: 300, level: 1 });
const side = (hand: SeenCard[]): SideView => ({ mzone: [], szone: [], hand, grave: 0, deck: 20 });

describe('Exodia (change speed-duel): a CPU guarda as peças', () => {
  it('no descarte, a peça é a última escolhida, mesmo com ATK menor que a outra carta', () => {
    const view: [SideView, SideView] = [side([]), side([inHand(HEAD, 0, 1000), inHand(5, 1, 1500), inHand(ARM, 2)])];
    const order = rankTargets(view[1].hand.map((c) => ({ ...c, location: OcgLocation.HAND })), 1, { view });
    expect(order[0]).toBe(1); // descarta o monstro comum
    expect(order.slice(1).sort()).toEqual([0, 2]);
  });

  it('a nota sobe com cada peça diferente na própria mão (cópia repetida não conta)', () => {
    const t = new DuelTrack();
    const one = evaluate([side([]), side([inHand(HEAD, 0), inHand(5, 1)])], t, 1, false);
    const two = evaluate([side([]), side([inHand(HEAD, 0), inHand(ARM, 1)])], t, 1, false);
    const dup = evaluate([side([]), side([inHand(HEAD, 0), inHand(HEAD, 1)])], t, 1, false);
    expect(two - one).toBe(EVAL.exodiaPiece);
    expect(dup).toBe(one);
  });
});
