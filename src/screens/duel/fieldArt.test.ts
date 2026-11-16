import { describe, expect, it } from 'vitest';
import type { Board, BoardCard } from '../../engine/protocol';
import { FIELD_SEQ, fieldBackdrop } from './fieldArt';

const UP = 1, DOWN = 10;
const board = (mine: BoardCard | null, foe: BoardCard | null) => {
  const sz = (c: BoardCard | null) => { const z: (BoardCard | null)[] = Array(8).fill(null); z[FIELD_SEQ] = c; return z; };
  return { players: [{ szone: sz(mine) }, { szone: sz(foe) }] } as unknown as Board;
};

describe('fieldBackdrop', () => {
  it('sem Magia de Campo: nada', () => {
    expect(fieldBackdrop(board(null, null), null)).toBeNull();
  });
  it('a última ativada ganha enquanto continua no campo', () => {
    expect(fieldBackdrop(board({ code: 1, position: UP }, { code: 2, position: UP }), { code: 2, p: 1 })).toBe(2);
  });
  it('a última saiu: vale a outra que está ativa', () => {
    expect(fieldBackdrop(board({ code: 1, position: UP }, null), { code: 2, p: 1 })).toBe(1);
  });
  it('baixada (face para baixo) não pinta o tapete', () => {
    expect(fieldBackdrop(board({ code: 1, position: DOWN }, null), null)).toBeNull();
  });
});
