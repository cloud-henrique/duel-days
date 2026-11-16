import { describe, expect, it } from 'vitest';
import { OcgLocation } from 'ocgcore-wasm';
import { Narrator } from './narrator';
import type { DuelSession } from './session';

/** Sessão falsa: só o que o retrato do tabuleiro consulta. */
function fakeSession(mzone0: unknown[]): DuelSession {
  const core = {
    duelQueryLocation: (_h: unknown, q: { controller: number; location: number }) => (q.controller === 0 && q.location === OcgLocation.MZONE ? mzone0 : []),
    duelQueryCount: () => 30,
  };
  return { core, handle: 0 } as unknown as DuelSession;
}

describe('Narrator.snapshot', () => {
  it('ATK/DEF "?" chega do motor como uint32 (4294967294) e vira −2 no retrato', () => {
    // Tyranno Infinity: ATK "?" → o motor guarda −2, a consulta devolve sem sinal.
    const s = fakeSession([{ code: 83235263, position: 1, attack: 4294967294, defense: 0 }, null]);
    const b = new Narrator().snapshot(s);
    expect(b.players[0].mzone[0]).toEqual({ code: 83235263, position: 1, attack: -2, defense: 0 });
    expect(b.players[0].mzone[1]).toBeNull();
  });

  it('valores comuns passam intactos', () => {
    const s = fakeSession([{ code: 1, position: 4, attack: 2500, defense: 2100 }]);
    expect(new Narrator().snapshot(s).players[0].mzone[0]).toMatchObject({ attack: 2500, defense: 2100 });
  });
});
