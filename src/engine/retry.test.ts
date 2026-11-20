// Resposta automática recusada pelo motor (RETRY): o driver tenta outra resposta do mesmo pedido em vez de devolver ao
// jogador o último prompt dele (o duelo travava: change `tier3-batalha-da-cidade`, Strings × Amazoness Archers no monkey).
import { describe, expect, it } from 'vitest';
import { OcgMessageType, OcgResponseType, SelectBattleCMDAction, type OcgMessage, type OcgResponse } from 'ocgcore-wasm';
import { alternatives } from './cpu';
import type { Beat } from './protocol';
import { C, HAS_ENGINE_DATA, mon, puzzle, st } from './__testing__/duel';

const K = { archers: 67987611, swordsWoman: 94004268, dark1800: 11321183 };
const cpuAttacks = (beats: Beat[]) => beats.filter((b) => b.k === 'attack' && b.from.p === 1);

describe('alternativas de um pedido', () => {
  it('comando de batalha: atacar vem antes de passar para a Main 2/End', () => {
    const m = { type: OcgMessageType.SELECT_BATTLECMD, player: 1, attacks: [{}, {}], chains: [], to_m2: true, to_ep: true } as unknown as OcgMessage;
    const alt = alternatives(m) as Extract<OcgResponse, { type: OcgResponseType.SELECT_BATTLECMD }>[];
    expect(alt.slice(0, 2).map((a) => [a.action, a.index])).toEqual([[SelectBattleCMDAction.SELECT_BATTLE, 0], [SelectBattleCMDAction.SELECT_BATTLE, 1]]);
    expect(alt.map((a) => a.action)).toContain(SelectBattleCMDAction.TO_M2);
  });
});

describe.skipIf(!HAS_ENGINE_DATA)('motor recusa a resposta da CPU', () => {
  it('Amazoness Archers obriga a atacar: a CPU ataca com o outro monstro em vez de travar o duelo', async () => {
    // A CPU ataca com o Dark Blade; o jogador ativa a Archers: os monstros da CPU perdem 500 e devem atacar. O Mokey Mokey
    // (300 → 0) não atacaria por conta própria; "ir para a Main 2" é recusado e o driver passa a atacar.
    const { out, beats } = await puzzle([
      mon(1, K.dark1800, 0), mon(1, C.mokey, 1), mon(0, K.swordsWoman, 2), st(0, K.archers, 0),
    ], {
      maxSims: 0, // a política barata (a das continuações e dos prompts automáticos) escolhe "ir para a Main 2"
      respond0: (m) => {
        if (m.type === OcgMessageType.SELECT_CHAIN) {
          const i = m.selects.findIndex((x) => x.code === K.archers);
          return { type: OcgResponseType.SELECT_CHAIN, index: i >= 0 ? i : (m.forced ? 0 : null) };
        }
        if (m.type === OcgMessageType.SELECT_EFFECTYN) return { type: OcgResponseType.SELECT_EFFECTYN, yes: false };
        if (m.type === OcgMessageType.SELECT_YESNO) return { type: OcgResponseType.SELECT_YESNO, yes: false };
        throw new Error(`prompt inesperado ${OcgMessageType[m.type]}`);
      },
    });
    expect(out.t === 'end' || out.board.turn >= 3).toBe(true);
    expect(cpuAttacks(beats).length).toBeGreaterThanOrEqual(2);
  });
});
