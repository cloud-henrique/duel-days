// Teste em massa: CPU x CPU com decks aleatórios do pool inteiro. Uso: npx tsx proto/smoke.ts [duelos=100] [seedInicial=1] [--barata]
// Padrão: respostas aleatórias (cobrem mais caminhos do motor). `--barata`: os dois lados com a política barata da CPU
// (procura laços dela).
// `--deuses`: os três Deuses Egípcios entram em cada deck (no lugar dos 3 primeiros monstros; change tier4-finais).
// Mede quantos duelos terminam, onde travam e quais cartas geram erro de Lua.
import { readFileSync } from 'node:fs';
import { OcgMessageType, OcgProcessResult } from 'ocgcore-wasm';
import { cpuRespond, newMemory, randomRespond, isSelect, makeRng } from '../src/engine/cpu';
import { randomDeck } from '../src/game/decks';
import { openCore, startDuel, type CardRecord, type DeckList } from '../src/engine/session';
import type { OcgCardData } from 'ocgcore-wasm';
import { Narrator } from '../src/engine/narrator';
import { checkLocs } from './beat-check';

const CHEAP = process.argv.includes('--barata');
if (CHEAP) process.argv.splice(process.argv.indexOf('--barata'), 1);
const GODS = process.argv.includes('--deuses');
if (GODS) process.argv.splice(process.argv.indexOf('--deuses'), 1);
// Decks densos de monstros (os do deck aleatório e Normais fracos no lugar das Magias/Armadilhas) para juntar os 3
// tributos com frequência.
const withGods = (d: DeckList): DeckList => {
  if (!GODS) return d;
  const mons = d.main.filter((id) => (cards[id].type & 1) !== 0);
  const fill = Object.values(cards).filter((c) => c.type === 17 && c.level <= 4 && c.attack <= 1500).map((c) => c.code);
  const main = [10000000, 10000010, 10000020, ...mons.slice(0, 15)];
  for (let k = 0; main.length < 30; k++) main.push(fill[(mons.length * 7 + k * 13) % fill.length]);
  return { ...d, main };
};
const N = Number(process.argv[2] ?? 100), SEED0 = Number(process.argv[3] ?? 1);
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
const poolIds = Object.keys(JSON.parse(readFileSync('public/data/pool.json', 'utf8'))).map(Number);
const cardList = Object.values(cards).map((c) => ({ ...c, race: BigInt(c.race) }) as OcgCardData);
const core = await openCore();
const stat = { fim: 0, passos: 0, semResposta: 0, erro: 0, laco: 0 };
const bad: string[] = [];
const retryDumps: string[] = [];
const snapErr = new Map<string, number>();
const luaErr = new Map<string, number>(), stall = new Map<string, number>();
let turns = 0;
// Beats (change `animar-duelo`): lugares válidos com o motor cru e decks do pool inteiro.
let beatCount = 0;
const beatErr = new Map<string, number>();
const godSummons = new Map<number, number>();
const t0 = performance.now();
for (let i = 0; i < N; i++) {
  const logs: string[] = [];
  let s;
  try {
    s = startDuel(core, { cards, script: (n) => scripts[n] ?? null }, [withGods(randomDeck(cards, poolIds, SEED0 + i * 2)), withGods(randomDeck(cards, poolIds, SEED0 + i * 2 + 1))], { seed: BigInt(SEED0 + i), log: (t) => logs.push(t) });
  } catch (e) { stat.erro++; console.log('erro ao criar duelo', String(e)); continue; }
  const rng = makeRng(SEED0 + i);
  const nar = new Narrator();
  const mems = [newMemory(), newMemory()];
  let outcome = 'passos', steps = 0, lastTypes = '', lastPrompt = '', lastMsg: unknown = null, lastResp: unknown = null;
  while (steps++ < 4000) {
    let step;
    try { step = s.step(); } catch (e) { outcome = 'laco'; bad.push(`seed ${SEED0 + i}: ${String(e)} (último prompt ${lastPrompt})`); break; }
    const { status, messages } = step;
    // A "foto" do tabuleiro e o texto dos eventos também rodam aqui, como no app.
    try {
      const bs = [...messages.flatMap((m) => nar.feed(m, s)), ...nar.flush()];
      beatCount += bs.length;
      for (const { beat: b } of bs) if (b.k === 'summon' && b.code >= 10000000 && b.code <= 10000020) godSummons.set(b.code, (godSummons.get(b.code) ?? 0) + 1);
      for (const e of checkLocs(bs)) beatErr.set(e, (beatErr.get(e) ?? 0) + 1);
      nar.snapshot(s);
    } catch (e) { const k = String((e as Error)?.message ?? e).slice(0, 120); snapErr.set(`seed ${SEED0 + i}: ${k}`, 1 + (snapErr.get(k) ?? 0)); }
    let won = false;
    for (const m of messages) { if (m.type === OcgMessageType.NEW_TURN) turns++; if (m.type === OcgMessageType.WIN) won = true; }
    if (won || status === OcgProcessResult.END) { outcome = 'fim'; break; }
    const sel = [...messages].reverse().find(isSelect);
    if (!sel && messages.some((m) => m.type === OcgMessageType.RETRY)) { outcome = 'semResposta'; lastTypes = `RETRY depois de ${lastPrompt}`; if (retryDumps.length < 6) retryDumps.push(JSON.stringify({ seed: SEED0 + i, prompt: lastMsg, resp: lastResp }, (_, v) => (typeof v === 'bigint' ? Number(v) : v)).slice(0, 1400)); break; }
    if (sel) { lastPrompt = OcgMessageType[sel.type]; lastMsg = sel; }
    const r = sel && (CHEAP
      ? cpuRespond(sel, { session: s, db: cards, cards: cardList, mem: mems[(sel as { player: number }).player & 1], turn: nar.turn })
      : randomRespond(sel, rng, { cards: cardList }));
    if (!r) { outcome = 'semResposta'; lastTypes = messages.map((m) => OcgMessageType[m.type]).join(','); break; }
    lastResp = r;
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
console.log('erros na foto do tabuleiro/eventos:', [...snapErr].slice(0, 8), 'total', snapErr.size);
console.log('duelos problemáticos:', bad.slice(0, 8));
console.log(`beats: ${beatCount}, lugares inválidos: ${[...beatErr.values()].reduce((a, b) => a + b, 0)}`, [...beatErr].slice(0, 8));
console.log('travas sem resposta:', [...stall].slice(0, 8));
if (GODS) console.log('Deuses invocados:', [...godSummons].map(([c, n]) => `${cards[c]?.name ?? c} x${n}`));

retryDumps.forEach((d) => console.log('RETRY>', d));
