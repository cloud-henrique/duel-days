// Força dos decks da campanha (change `campanha-tiers`), com os decks já no campaign.json: cada duelista contra todos
// os outros (CPU × CPU no DuelDriver, trocando de lado) e o cenário "Chefe mais forte": o chefe de cada tier precisa
// vencer a maioria dos duelos contra os comuns do mesmo tier.
// Uso: npx tsx proto/tier-balance.ts [duelosPorPar=30]
import { readFileSync } from 'node:fs';
import { cpuRespond, makeRng } from '../src/engine/cpu';
import { DuelDriver } from '../src/engine/driver';
import { openCore, type CardRecord, type DeckList } from '../src/engine/session';
import { DUELISTS, TIERS } from '../src/campaign/data/types';
import { duelistDeck } from '../src/campaign/decks';
import type { OcgMessage } from 'ocgcore-wasm';

const N = Number(process.argv[2] ?? 30);
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
const core = await openCore();

function duel(a: DeckList, b: DeckList, seed: number): number {
  const d = new DuelDriver(core, cards, (n) => scripts[n] ?? null, a, b, seed);
  const rng = makeRng(seed * 7 + 3);
  let out = d.run();
  for (let k = 0; k < 3000 && out.t === 'prompt'; k++) {
    const r = cpuRespond(out.msg as OcgMessage, rng, {});
    if (!r) break;
    out = d.respond(r);
  }
  d.session.destroy();
  return out.t === 'end' && (out.winner === 0 || out.winner === 1) ? out.winner : -1;
}
/** Taxa de vitória de `a` contra `b`. */
function rate(a: DeckList, b: DeckList, seed0: number) {
  let wins = 0, games = 0;
  for (let i = 0; i < N; i++) {
    const swap = i % 2 === 1;
    const w = swap ? duel(b, a, seed0 + i) : duel(a, b, seed0 + i);
    if (w < 0) continue;
    games++;
    if ((w === 0) !== swap) wins++;
  }
  return games ? wins / games : 0;
}

const keys = DUELISTS.map((d) => d.key);
const decks = Object.fromEntries(keys.map((k) => [k, duelistDeck(k)]));
const vs: Record<string, Record<string, number>> = {};
let seed = 1;
for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
  const r = rate(decks[keys[i]], decks[keys[j]], seed); seed += N;
  (vs[keys[i]] ??= {})[keys[j]] = r;
  (vs[keys[j]] ??= {})[keys[i]] = 1 - r;
}
const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);
console.log(`\nTaxa de vitória contra todos (${N} duelos por par):`);
const overall = keys.map((k) => ({ k, r: keys.filter((o) => o !== k).reduce((s, o) => s + vs[k][o], 0) / (keys.length - 1) }));
for (const { k, r } of overall.sort((a, b) => b.r - a.r)) console.log(`  ${pct(r)}  ${k}`);

let fail = false;
console.log('\nChefe contra os comuns do tier:');
for (const t of TIERS) {
  const boss = t.duelists.find((d) => d.isBoss);
  if (!boss) continue;
  const regs = t.duelists.filter((d) => !d.isBoss);
  const rs = regs.map((d) => vs[boss.key][d.key]);
  const avg = rs.reduce((s, x) => s + x, 0) / rs.length;
  console.log(`  Tier ${t.number} · ${boss.name}: ${pct(avg)} (${regs.map((d, i) => `${d.key} ${pct(rs[i])}`).join(', ')})`);
  if (avg <= 0.5) fail = true;
}
if (fail) { console.log('ALERTA: um chefe não vence a maioria contra os comuns do tier'); process.exitCode = 1; }
