// Spike do change `animar-duelo` (tarefa 1.2): confere que o `reason` do MSG_MOVE chega pelo patch do `ocgcore-wasm`.
// Roda duelos CPU x CPU com o DuelDriver e imprime os motivos dos movimentos campo → cemitério e mão → cemitério.
// Uso: npx tsx proto/move-reason.ts [duelos=20]
import { readFileSync } from 'node:fs';
import { OcgLocation, OcgMessageType, type OcgMessage } from 'ocgcore-wasm';
import { cpuRespond, makeRng } from '../src/engine/cpu';
import { DuelDriver } from '../src/engine/driver';
import { openCore, type CardRecord } from '../src/engine/session';
import { randomDeck } from '../src/game/decks';

const N = Number(process.argv[2] ?? 20);
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
const poolIds = Object.keys(JSON.parse(readFileSync('public/data/pool.json', 'utf8'))).map(Number);

const REASONS: [number, string][] = [
  [0x1, 'DESTROY'], [0x2, 'RELEASE'], [0x8, 'MATERIAL'], [0x10, 'SUMMON'], [0x20, 'BATTLE'], [0x40, 'EFFECT'],
  [0x80, 'COST'], [0x400, 'RULE'], [0x4000, 'DISCARD'], [0x20000, 'RETURN'], [0x40000, 'FUSION'], [0x100000, 'RITUAL'],
  [0x2000000, 'DRAW'],
];
const bits = (r: number) => REASONS.filter(([b]) => r & b).map(([, n]) => n).join('|') || `0x${r.toString(16)}`;
const ONFIELD = OcgLocation.MZONE | OcgLocation.SZONE;

const tally = new Map<string, number>();
let moves = 0, missing = 0;
const core = await openCore();
for (let i = 0; i < N; i++) {
  const d = new DuelDriver(core, cards, (n) => scripts[n] ?? null, randomDeck(cards, poolIds, i * 3 + 1), randomDeck(cards, poolIds, i * 3 + 2), i + 1);
  const step = d.session.step.bind(d.session);
  d.session.step = () => {
    const r = step();
    for (const m of r.messages) {
      if (m.type !== OcgMessageType.MOVE) continue;
      moves++;
      if (typeof m.reason !== 'number') { missing++; continue; }
      if (m.to.location !== OcgLocation.GRAVE) continue;
      const from = m.from.location & ONFIELD ? 'campo' : m.from.location === OcgLocation.HAND ? 'mão' : null;
      if (!from) continue;
      const key = `${from} → cemitério: ${bits(m.reason)}`;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
    return r;
  };
  const rng = makeRng(i * 13 + 5);
  let out = d.run();
  for (let k = 0; k < 3000 && out.t === 'prompt'; k++) {
    const r = cpuRespond(out.msg as OcgMessage, rng, {});
    if (!r) break;
    out = d.respond(r);
  }
  d.session.destroy();
}
console.log(`${moves} MOVE, ${missing} sem reason`);
[...tally].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(String(n).padStart(5), k));
