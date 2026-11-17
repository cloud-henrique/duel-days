// Torneio das receitas (change `campanha-tiers`): para cada duelista, as candidatas de raw/decks/candidates.json
// (scripts/fetch_deck_recipes.py) se enfrentam entre si e contra um grupo fixo de referência (os decks do nativo do
// Tier 1 e o deck inicial), CPU × CPU no mesmo DuelDriver do Worker, trocando de lado a cada duelo. A vencedora é a de
// maior taxa de vitória. Grava raw/decks/picks.json e imprime a tabela.
// Uso: npx tsx proto/deck-pick.ts [duelosPorPar=20] [duelista ...]
import { readFileSync, writeFileSync } from 'node:fs';
import { cpuRespond, makeRng } from '../src/engine/cpu';
import { DuelDriver } from '../src/engine/driver';
import { openCore, type CardRecord, type DeckList } from '../src/engine/session';
import { validateDeck } from '../src/game/decks';
import type { OcgMessage } from 'ocgcore-wasm';

interface Candidate { name: string; url: string; views: number; cover: number; main: number[]; extra: number[]; swaps: unknown[] }

const N = Number(process.argv[2] ?? 20);
const only = process.argv.slice(3);
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
const all = JSON.parse(readFileSync('raw/decks/candidates.json', 'utf8')) as Record<string, Candidate[]>;
const ref = JSON.parse(readFileSync('raw/decks/reference.json', 'utf8')) as Record<string, DeckList>;
const core = await openCore();

/** Um duelo; devolve 0 se `a` venceu, 1 se `b` venceu, -1 empate/erro/limite. `a` joga como jogador 0. */
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

/** Vitórias de `a` contra `b` em N duelos, alternando quem é o jogador 0. */
function match(a: DeckList, b: DeckList, seed0: number) {
  let wins = 0, games = 0;
  for (let i = 0; i < N; i++) {
    const swap = i % 2 === 1;
    const w = swap ? duel(b, a, seed0 + i) : duel(a, b, seed0 + i);
    if (w < 0) continue;
    games++;
    if ((w === 0) !== swap) wins++;
  }
  return { wins, games };
}

const picks: Record<string, { index: number; name: string; url: string; rate: number }> = {};
try { Object.assign(picks, JSON.parse(readFileSync('raw/decks/picks.json', 'utf8'))); } catch { /* primeira vez */ }

for (const [key, cands] of Object.entries(all)) {
  if (only.length && !only.includes(key)) continue;
  const decks = cands.map((c) => ({ main: c.main, extra: c.extra }));
  decks.forEach((d, i) => { const p = validateDeck(d, cards); if (p.length) console.log(`  ${key} #${i} inválido: ${p.join(' ')}`); });
  const score = cands.map(() => ({ wins: 0, games: 0 }));
  const add = (i: number, r: { wins: number; games: number }) => { score[i].wins += r.wins; score[i].games += r.games; };
  let seed = 1;
  for (let i = 0; i < decks.length; i++) {
    for (let j = i + 1; j < decks.length; j++) {
      const r = match(decks[i], decks[j], seed); seed += N;
      add(i, r); add(j, { wins: r.games - r.wins, games: r.games });
    }
    for (const [, g] of Object.entries(ref)) { add(i, match(decks[i], g, seed)); seed += N; }
  }
  const rows = cands.map((c, i) => ({ i, name: c.name, rate: score[i].games ? score[i].wins / score[i].games : 0, games: score[i].games }));
  rows.sort((a, b) => b.rate - a.rate);
  console.log(`\n## ${key}`);
  for (const r of rows) console.log(`  ${(r.rate * 100).toFixed(1).padStart(5)}%  (${r.games} duelos)  #${r.i} ${r.name}`);
  const best = rows[0];
  picks[key] = { index: best.i, name: best.name, url: cands[best.i].url, rate: Math.round(best.rate * 1000) / 1000 };
  writeFileSync('raw/decks/picks.json', JSON.stringify(picks, null, 1));
}
