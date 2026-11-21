import { describe, expect, it } from 'vitest';
import { OcgLocation, OcgPosition } from 'ocgcore-wasm';
import { Narrator } from './narrator';
import { HAS_ENGINE_DATA, normalWithAtk, puzzle } from './__testing__/duel';

const FLAME_SWORDSMAN = 45231177;

describe.skipIf(!HAS_ENGINE_DATA)('retrato: Banidas e Extra Deck (change tabuleiro-plano)', () => {
  it('lê as banidas (com a posição) e o Extra Deck dos dois duelistas', async () => {
    const up = normalWithAtk(1800), down = normalWithAtk(1400);
    const { driver } = await puzzle([
      { p: 0, code: up, location: OcgLocation.REMOVED, position: OcgPosition.FACEUP_ATTACK },
      { p: 0, code: down, location: OcgLocation.REMOVED, position: OcgPosition.FACEDOWN_DEFENSE },
      { p: 0, code: FLAME_SWORDSMAN, location: OcgLocation.EXTRA, position: OcgPosition.FACEDOWN_DEFENSE },
      { p: 1, code: FLAME_SWORDSMAN, location: OcgLocation.EXTRA, position: OcgPosition.FACEDOWN_DEFENSE },
      { p: 1, code: FLAME_SWORDSMAN, location: OcgLocation.EXTRA, position: OcgPosition.FACEDOWN_DEFENSE },
    ]);
    const [me, foe] = new Narrator().snapshot(driver.session).players;
    expect(me.removed.map((c) => c.code).sort()).toEqual([up, down].sort());
    expect(me.removed.find((c) => c.code === down)!.position & OcgPosition.FACEDOWN).toBeTruthy();
    expect(me.extra.map((c) => c.code)).toEqual([FLAME_SWORDSMAN]);
    expect(foe.extra).toHaveLength(2);
    expect(foe.removed).toEqual([]);
  });
});
