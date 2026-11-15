// Teste em massa: CPU x CPU com decks aleatórios do pool inteiro. Uso: npx tsx proto/smoke.ts [duelos=100] [seedInicial=1]
// Mede quantos duelos terminam, onde travam e quais cartas geram erro de Lua.
import { readFileSync } from 'node:fs';
import { OcgMessageType, OcgProcessResult } from 'ocgcore-wasm';
import { cpuRespond, isSelect, makeRng } from '../src/engine/cpu';
import { randomDeck } from '../src/game/decks';
import { openCore, startDuel, type CardRecord } from '../src/engine/session';
import type { OcgCardData } from 'ocgcore-wasm';

const N = Number(process.argv[2] ?? 100), SEED0 = Number(process.argv[3] ?? 1);
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
const poolIds = Object.keys(JSON.parse(readFileSync('public/data/pool.json', 'utf8'))).map(Number);
const cardList = Object.values(cards).map((c) => ({ ...c, race: BigInt(c.race) }) as OcgCardData);
const core = await openCore();
const stat = { fim: 0, passos: 0, semResposta: 0, erro: 0, laco: 0 };
const bad: string[] = [];
const luaErr = new Map<string, number>(), stall = new Map<string, number>();
let turns = 0;
const t0 = performance.now();
for (let i = 0; i < N; i++) {
  const logs: string[] = [];
  let s;
  try {
    s = startDuel(core, { cards, script: (n) => scripts[n] ?? null }, [randomDeck(cards, poolIds, SEED0 + i * 2), randomDeck(cards, poolIds, SEED0 + i * 2 + 1)], { seed: BigInt(SEED0 + i), log: (t) => logs.push(t) });
  } catch (e) { stat.erro++; console.log('erro ao criar duelo', String(e)); continue; }
  const rng = makeRng(SEED0 + i);
  let outcome = 'passos', steps = 0, lastTypes = '', lastPrompt = '';
  while (steps++ < 4000) {
    let step;
    try { step = s.step(); } catch (e) { outcome = 'laco'; bad.push(`seed ${SEED0 + i}: ${String(e)} (último prompt ${lastPrompt})`); break; }
    const { status, messages } = step;
    let won = false;
    for (const m of messages) { if (m.type === OcgMessageType.NEW_TURN) turns++; if (m.type === OcgMessageType.WIN) won = true; }
    if (won || status === OcgProcessResult.END) { outcome = 'fim'; break; }
    const sel = [...messages].reverse().find(isSelect);
    if (!sel && messages.some((m) => m.type === OcgMessageType.RETRY)) { outcome = 'semResposta'; lastTypes = `RETRY depois de ${lastPrompt}`; break; }
    if (sel) lastPrompt = OcgMessageType[sel.type];
    const r = sel && cpuRespond(sel, rng, { cards: cardList });
    if (!r) { outcome = 'semResposta'; lastTypes = messages.map((m) => OcgMessageType[m.type]).join(','); break; }
    try { s.respond(r); } catch (e) { outcome = 'erro'; lastTypes = String(e); break; }
  }
  stat[outcome as keyof typeof stat]++;
  if (outcome === 'semResposta') stall.set(lastTypes, (stall.get(lastTypes) ?? 0) + 1);
  for (const l of new Set(logs)) {
    if (!/\[core/.test(l)) continue;
    const code = /c(\d+)\.lua/.exec(l)?.[1] ?? `?${l.slice(0, 90)}`;
    luaErr.set(code, (luaErr.get(code) ?? 0) + 1);
  }
  s.destroy();
}
console.log(`${N} duelos em ${Math.round(performance.now() - t0)} ms, ${turns} turnos`, stat);
const top = [...luaErr].sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log('cartas com erro de Lua (duelos afetados):', top.map(([c, n]) => `${cards[c]?.name ?? c} [${c}] x${n}`));
console.log('duelos problemáticos:', bad.slice(0, 8));
console.log('travas sem resposta:', [...stall].slice(0, 8));
