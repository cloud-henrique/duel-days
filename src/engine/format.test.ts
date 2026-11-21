import { describe, expect, it } from 'vitest';
import { OcgPhase } from 'ocgcore-wasm';
import { DuelDriver } from './driver';
import { openCore } from './session';
import { FORMAT } from '../game/format';
import { HAS_ENGINE_DATA, engineData, normalWithAtk } from './__testing__/duel';

describe.skipIf(!HAS_ENGINE_DATA)('formato Speed Duel (change speed-duel)', () => {
  it('LP 4000, mão de 4, só as 3 colunas do meio e sem Main Phase 2', async () => {
    const { cards, scripts } = engineData();
    const deck = { main: [normalWithAtk(1800), normalWithAtk(1400), normalWithAtk(1200)].flatMap((c) => Array(10).fill(c)), extra: [] };
    const d = new DuelDriver(await openCore(), cards, (n) => scripts[n] ?? null, deck, deck, 7, undefined, { budget: { maxMs: Infinity, maxSims: 0 } });
    let out = d.run();
    const seqs = new Set<number>(); const phases = new Set<number>();
    let first = true;
    for (let k = 0; k < 80 && out.t === 'prompt'; k++) {
      for (const s of out.steps) {
        if (!s.board) continue;
        if (first) {
          first = false;
          expect(s.board.players.map((p) => p.lp)).toEqual([FORMAT.lp, FORMAT.lp]);
          expect(s.board.players[1].hand).toHaveLength(FORMAT.hand);
        }
        phases.add(s.board.phase);
        for (const p of s.board.players) p.mzone.forEach((c, i) => { if (c) seqs.add(i); });
      }
      out = d.respond(d.cheap(out.msg)!);
    }
    expect(seqs.size).toBeGreaterThan(0);
    expect([...seqs].every((s) => FORMAT.columns.includes(s))).toBe(true);
    expect(phases.has(OcgPhase.MAIN1)).toBe(true);
    expect(phases.has(OcgPhase.MAIN2)).toBe(false);
  }, 180_000);
});
