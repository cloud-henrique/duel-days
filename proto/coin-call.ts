// Spike do change visual-base (tarefa 3.1): o que o motor manda quando o jogador escolhe cara ou coroa (Duel.CallCoin →
// AnnounceCoin) e o TOSS_COIN em seguida. Duelo com o Mago do Tempo na mão do jogador.
// Uso: npx tsx proto/coin-call.ts
import { readFileSync } from 'node:fs';
import { OcgMessageType, OcgResponseType, SelectIdleCMDAction, type OcgMessage } from 'ocgcore-wasm';
import { randomRespond, makeRng } from '../src/engine/cpu';
import { DuelDriver } from '../src/engine/driver';
import { openCore, type CardRecord } from '../src/engine/session';

const TIME_WIZARD = 71625222;
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
const normals = Object.values(cards).filter((c) => c.type === 0x11).slice(0, 37).map((c) => c.code);
const mine = { main: [TIME_WIZARD, TIME_WIZARD, TIME_WIZARD, ...normals], extra: [] };
const foe = { main: normals.slice(0, 40), extra: [] };
const core = await openCore();
const rng = makeRng(3);
for (let seed = 1; seed <= 20; seed++) {
  const d = new DuelDriver(core, cards, (n) => scripts[n] ?? null, mine, foe, seed);
  let out = d.run();
  let summoned = false, done = false;
  for (let k = 0; k < 300 && out.t === 'prompt' && !done; k++) {
    const m: OcgMessage = out.msg;
    if (m.type === OcgMessageType.SELECT_OPTION) {
      console.log(`seed ${seed}: SELECT_OPTION`, JSON.stringify(m, (_, v) => (typeof v === 'bigint' ? `${v}n` : v)));
      out = d.respond({ type: OcgResponseType.SELECT_OPTION, index: 0 });
      if (out.t === 'prompt' || out.t === 'end') for (const { beat } of out.steps) if (beat.k === 'toss') console.log('  toss beat:', JSON.stringify(beat));
      done = true; break;
    }
    if (m.type === OcgMessageType.SELECT_IDLECMD) {
      const tw = m.summons.findIndex((c) => c.code === TIME_WIZARD);
      const act = m.activates.findIndex((c) => c.code === TIME_WIZARD);
      if (act >= 0) { out = d.respond({ type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.SELECT_ACTIVATE, index: act }); continue; }
      if (!summoned && tw >= 0) { summoned = true; out = d.respond({ type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.SELECT_SUMMON, index: tw }); continue; }
    }
    out = d.respond(randomRespond(m, rng, {})!);
  }
  d.session.destroy();
  if (done) break;
}
