// Smoke test em Node: CPU vs CPU com cartas e scripts reais. Uso: npx tsx proto/smoke.ts
import { readFileSync } from 'node:fs';
import { OcgMessageType, OcgProcessResult } from 'ocgcore-wasm';
import { cpuRespond, isSelect, makeRng } from '../src/engine/cpu';
import { openCore, startDuel, type CardRecord } from '../src/engine/session';

const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const pool = Object.keys(cards).map(Number);
const deck = (): number[] => Array.from({ length: 40 }, (_, i) => pool[i % pool.length]);
const logs: string[] = [];
const core = await openCore();
console.log('ocgcore versão', core.getVersion?.());
const s = startDuel(core, { cards, script: (n) => { try { return readFileSync(`public/scripts/${n}`, 'utf8'); } catch { return null; } } },
  [deck(), deck()], { log: (t) => logs.push(t) });
const rng = makeRng(42);
const counts: Record<string, number> = {};
let last: unknown[] = [];
let turns = 0, steps = 0, winner: number | null = null;
const t0 = performance.now();
while (steps++ < 5000) {
  const { status, messages } = s.step();
  for (const m of messages) {
    const k = (OcgMessageType[m.type] ?? String(m.type)); counts[k] = (counts[k] ?? 0) + 1;
    if (m.type === OcgMessageType.NEW_TURN) turns++;
    if (m.type === OcgMessageType.WIN) last = [m];
    if (m.type === OcgMessageType.WIN) winner = m.player;
  }
  if (status === OcgProcessResult.END || winner !== null) break;
  const sel = [...messages].reverse().find(isSelect);
  const r = sel && cpuRespond(sel, rng);
  if (!r) { console.log('sem resposta para', sel?.type, messages.map((m) => m.type)); break; }
  s.respond(r);
}
console.log(JSON.stringify(counts), last);
console.log({ turns, steps, winner, ms: Math.round(performance.now() - t0) });
console.log('logs do core:', [...new Set(logs)].slice(0, 60));
