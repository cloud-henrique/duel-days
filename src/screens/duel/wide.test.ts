import { describe, expect, it } from 'vitest';
import { OcgLocation, OcgPosition } from 'ocgcore-wasm';
import type { Board, PlayerBoard } from '../../engine/protocol';
import { actionsPos, cardAtLoc } from './wide';

const UP = OcgPosition.FACEUP_ATTACK, DOWN = OcgPosition.FACEDOWN_DEFENSE;
const pb = (o: Partial<PlayerBoard> = {}): PlayerBoard => ({ lp: 4000, deck: 26, hand: [], mzone: [null, null, null, null, null], szone: [null, null, null, null, null, null], grave: [], removed: [], extra: [], ...o });
const board = (me: PlayerBoard, foe: PlayerBoard): Board => ({ players: [me, foe], turn: 1, turnPlayer: 0, phase: 4 });

describe('carta sob o ponteiro (tela larga)', () => {
  const b = board(
    pb({ hand: [{ code: 10, position: UP }], mzone: [null, { code: 11, position: DOWN }, null, null, null], grave: [{ code: 12, position: UP }, { code: 13, position: UP }] }),
    pb({ hand: [{ code: 20, position: UP }], mzone: [null, { code: 21, position: UP }, { code: 22, position: DOWN }, null, null], removed: [{ code: 23, position: DOWN }] }),
  );

  it('mão, zonas e o topo das pilhas do jogador, inclusive as viradas dele', () => {
    expect(cardAtLoc(b, '0:hand:0')).toEqual({ code: 10, ref: { controller: 0, location: OcgLocation.HAND, sequence: 0 } });
    expect(cardAtLoc(b, '0:mzone:1')?.code).toBe(11);
    expect(cardAtLoc(b, '0:grave')).toEqual({ code: 13, ref: { controller: 0, location: OcgLocation.GRAVE, sequence: 1 } });
  });

  it('do oponente, só o que está virado para cima', () => {
    expect(cardAtLoc(b, '1:mzone:1')?.code).toBe(21);
    expect(cardAtLoc(b, '1:mzone:2')).toBeNull();
    expect(cardAtLoc(b, '1:hand:0')).toBeNull();
    expect(cardAtLoc(b, '1:removed')).toBeNull();
  });

  it('zona vazia, deck, Extra e placa não mostram nada', () => {
    for (const loc of ['0:mzone:2', '0:deck', '0:extra', '0:plate', '0:removed', 'x']) expect(cardAtLoc(b, loc)).toBeNull();
  });
});

describe('posição das ações sobre a carta', () => {
  const area = { width: 1000, height: 800 };
  it('centrada acima da carta', () => {
    expect(actionsPos({ left: 400, top: 500, width: 100, height: 140 }, 200, 50, area, 8)).toEqual({ left: 350, top: 442, below: false });
  });
  it('sem espaço acima, vai para baixo', () => {
    expect(actionsPos({ left: 400, top: 20, width: 100, height: 140 }, 200, 50, area, 8)).toEqual({ left: 350, top: 168, below: true });
  });
  it('presa às bordas da área', () => {
    expect(actionsPos({ left: 0, top: 500, width: 60, height: 80 }, 200, 50, area, 8).left).toBe(8);
    expect(actionsPos({ left: 960, top: 500, width: 40, height: 80 }, 200, 50, area, 8).left).toBe(792);
  });
});
