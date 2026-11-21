import { describe, expect, it } from 'vitest';
import { OcgLocation } from 'ocgcore-wasm';
import { randomRespond, makeRng } from './cpu';
import { DuelDriver } from './driver';
import { openCore } from './session';
import { DuelTrack } from './track';
import { boardView } from './view';
import { duelistDeck, starterDeck } from '../campaign/decks';
import { C, engineData, HAS_ENGINE_DATA, mon, puzzle, zoneSeq } from './__testing__/duel';

describe.skipIf(!HAS_ENGINE_DATA)('cópia do duelo por replay', () => {
  it('registra uma entrada por resposta enviada ao motor', async () => {
    const { cards, scripts } = engineData();
    const d = new DuelDriver(await openCore(), cards, (n) => scripts[n] ?? null, starterDeck(), duelistDeck('rex'), 3, undefined, { budget: { maxSims: 0 } });
    const sent: number[] = [];
    const orig = d.session.respond.bind(d.session);
    let count = 0;
    (d.session as { respond: typeof orig }).respond = (r) => { count++; orig(r); };
    let out = d.run();
    const rng = makeRng(3);
    for (let i = 0; i < 40 && out.t === 'prompt'; i++) { out = d.respond(randomRespond(out.msg, rng)!); sent.push(i); }
    expect(d.session.log.length).toBe(count);
  });

  it('a cópia reproduz o tabuleiro e o LP do duelo original', async () => {
    const { cards, scripts } = engineData();
    const d = new DuelDriver(await openCore(), cards, (n) => scripts[n] ?? null, starterDeck(), duelistDeck('rex'), 11, undefined, { budget: { maxSims: 0 } });
    let out = d.run();
    const rng = makeRng(11);
    let checked = 0;
    for (let i = 0; i < 300 && out.t === 'prompt'; i++) {
      if (i % 3 === 0) {
        const track = new DuelTrack();
        const f = d.fork.fork(track);
        try {
          track.feed(f.step().messages);
          expect(boardView(f)).toEqual(boardView(d.session));
          expect(track.lp).toEqual(out.board.players.map((p) => p.lp));
          checked++;
        } finally { f.destroy(); }
      }
      out = d.respond(randomRespond(out.msg, rng)!);
    }
    expect(checked).toBeGreaterThan(3);
  });
});

describe.skipIf(!HAS_ENGINE_DATA)('quebra-cabeça', () => {
  it('coloca as cartas nas zonas pedidas', async () => {
    const { driver } = await puzzle([mon(1, C.tyhone, 2), mon(0, C.mokey, 0)], { maxSims: 0 });
    const v = boardView(driver.session);
    // O Tyhone da CPU continua na coluna 2 (ou atacou e destruiu o Mokey; nos dois casos está lá).
    expect(v[1].mzone.find((c) => c.code === C.tyhone)?.sequence).toBe(zoneSeq(2));
    expect(v[1].mzone[0].location).toBe(OcgLocation.MZONE);
  });
});
