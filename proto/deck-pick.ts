// Torneio das receitas (changes `campanha-tiers` e `cpu-estrategica`): para cada duelista, cada candidata de
// raw/decks/candidates-speed.json (scripts/fetch_deck_recipes.py, cortadas para o Speed Duel por
// `scripts/build_decks.py --candidatas`) enfrenta o deck inicial, com a CPU nova dos dois lados (a
// candidata no perfil do duelista, o deck inicial no comum), trocando quem começa. A vencedora é a de maior taxa; se ela
// ficar a mais de 10 pontos da meta do tier e outra candidata ficar dentro, fica a melhor das que estão dentro.
// Grava raw/decks/picks.json e imprime a tabela.
// Uso: npx tsx proto/deck-pick.ts [duelosPorCandidata=12] [duelista ...] [--cpu=busca[:N]] [--procs=N]
import { readFileSync, writeFileSync } from 'node:fs';
import type { DeckList } from '../src/engine/session';
import { cpuFor, starterDeck } from '../src/campaign/decks';
import { validateDeck } from '../src/game/decks';
import type { CardRecord } from '../src/engine/session';
import { cpuDuel, isChild, parallel, serveChild } from './cpu-duel';
import { cpuMode } from './cpu-mode';
import { targetFor } from './difficulty-target';

interface Candidate { name: string; url: string; views: number; cover: number; main: number[]; extra: number[]; swaps: unknown[] }
interface Job { key: string; c: number; deck: DeckList; i: number }

const MODE = cpuMode('busca:8');
const pi = process.argv.findIndex((a) => a.startsWith('--procs='));
const PROCS = pi >= 0 ? Number(process.argv.splice(pi, 1)[0].split('=')[1]) : undefined;
const N = Number(process.argv[2] ?? 12);
const only = process.argv.slice(3);

async function work({ key, deck, i }: Job): Promise<boolean | null> {
  const seed = 9000 + i * 11;
  const swap = i % 2 === 1;
  const kind = cpuFor(key);
  const r = swap ? await cpuDuel(deck, kind, starterDeck(), 'comum', seed, MODE.budget)
    : await cpuDuel(starterDeck(), 'comum', deck, kind, seed, MODE.budget);
  return r.winner < 0 ? null : r.winner === (swap ? 0 : 1);
}

if (isChild()) serveChild(work);
else {
  const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
  const all = JSON.parse(readFileSync('raw/decks/candidates-speed.json', 'utf8')) as Record<string, Candidate[]>;
  const picks: Record<string, { index: number; name: string; url: string; rate: number }> = {};
  try { Object.assign(picks, JSON.parse(readFileSync('raw/decks/picks.json', 'utf8'))); } catch { /* primeira vez */ }
  const keys = Object.keys(all).filter((k) => !only.length || only.includes(k));
  const jobs: Job[] = [];
  for (const key of keys) all[key].forEach((c, ci) => {
    const deck = { main: c.main, extra: c.extra };
    const p = validateDeck(deck, cards);
    if (p.length) console.log(`  ${key} #${ci} inválido: ${p.join(' ')}`);
    for (let i = 0; i < N; i++) jobs.push({ key, c: ci, deck, i });
  });
  console.log(`${MODE.label}; ${N} duelos por candidata contra o deck inicial (${jobs.length} duelos)`);
  const t0 = Date.now();
  const res = await parallel<Job, boolean | null>(jobs, PROCS, (n) => { if (n % 50 === 0) console.log(`  ${n}/${jobs.length} (${Math.round((Date.now() - t0) / 1000)} s)`); });
  for (const key of keys) {
    const target = targetFor(key);
    const rows = all[key].map((c, ci) => {
      const rs = res.filter((_, j) => jobs[j].key === key && jobs[j].c === ci).filter((r): r is boolean => r != null);
      return { i: ci, name: c.name, rate: rs.length ? rs.filter(Boolean).length / rs.length : 0, games: rs.length };
    }).sort((a, b) => b.rate - a.rate);
    const inside = rows.filter((r) => Math.abs(r.rate - target) <= 0.1);
    const best = Math.abs(rows[0].rate - target) <= 0.1 || !inside.length ? rows[0] : inside[0];
    console.log(`\n## ${key} (meta ${Math.round(target * 100)}%)`);
    for (const r of rows) console.log(`  ${(r.rate * 100).toFixed(1).padStart(5)}%  (${r.games} duelos)  #${r.i} ${r.name}${r === best ? '  <- escolhida' : ''}`);
    picks[key] = { index: best.i, name: best.name, url: all[key][best.i].url, rate: Math.round(best.rate * 1000) / 1000 };
  }
  writeFileSync('raw/decks/picks.json', JSON.stringify(picks, null, 1));
  console.log(`\nok → raw/decks/picks.json (${Math.round((Date.now() - t0) / 1000)} s)`);
}
