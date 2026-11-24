// Força dos decks da campanha (changes `campanha-tiers` e `cpu-estrategica`): cada duelista contra os outros do mesmo
// tier, com a CPU nova dos dois lados (cada um no seu perfil), trocando quem começa, e o cenário "Chefe mais forte": o
// chefe de cada tier precisa vencer a maioria dos duelos contra os comuns do tier, e o duelo final (change tier4-finais), a
// maioria contra o chefe.
// Uso: npx tsx proto/tier-balance.ts [duelosPorPar=12] [--cpu=barata|busca[:N]] [--procs=N] [--tier=N]
import { TIERS } from '../src/campaign/data/types';
import { cpuFor, duelistDeck } from '../src/campaign/decks';
import { cpuDuel, isChild, parallel, serveChild } from './cpu-duel';
import { cpuMode } from './cpu-mode';

const MODE = cpuMode('busca:12');
const pi = process.argv.findIndex((a) => a.startsWith('--procs='));
const PROCS = pi >= 0 ? Number(process.argv.splice(pi, 1)[0].split('=')[1]) : undefined;
const ti = process.argv.findIndex((a) => a.startsWith('--tier='));
const ONLY_TIER = ti >= 0 ? Number(process.argv.splice(ti, 1)[0].split('=')[1]) : undefined;
const TIERS_RUN = TIERS.filter((t) => ONLY_TIER === undefined || t.number === ONLY_TIER);
const N = Number(process.argv[2] ?? 12);

interface Job { a: string; b: string; i: number }

/** `a` venceu? (null: sem vencedor). Ímpar: `b` começa. */
async function work({ a, b, i }: Job): Promise<boolean | null> {
  const swap = i % 2 === 1;
  const seed = 7000 + i * 13;
  const r = swap ? await cpuDuel(duelistDeck(b), cpuFor(b), duelistDeck(a), cpuFor(a), seed, MODE.budget)
    : await cpuDuel(duelistDeck(a), cpuFor(a), duelistDeck(b), cpuFor(b), seed, MODE.budget);
  return r.winner < 0 ? null : r.winner === (swap ? 1 : 0);
}

if (isChild()) serveChild(work);
else {
  const pairs: [string, string][] = [];
  for (const t of TIERS_RUN) {
    const ks = t.duelists.map((d) => d.key);
    for (let x = 0; x < ks.length; x++) for (let y = x + 1; y < ks.length; y++) pairs.push([ks[x], ks[y]]);
  }
  const jobs: Job[] = pairs.flatMap(([a, b]) => Array.from({ length: N }, (_, i) => ({ a, b, i })));
  console.log(`${MODE.label}; ${N} duelos por par dentro de cada tier (${jobs.length} duelos)`);
  const res = await parallel<Job, boolean | null>(jobs, PROCS);
  const rate = (a: string, b: string) => {
    let w = 0, g = 0;
    jobs.forEach((j, k) => {
      const r = res[k];
      if (r == null) return;
      if (j.a === a && j.b === b) { g++; if (r) w++; } else if (j.a === b && j.b === a) { g++; if (!r) w++; }
    });
    return g ? w / g : 0;
  };
  const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);
  let fail = false;
  for (const t of TIERS_RUN) {
    if (!t.duelists.length) continue;
    const boss = t.duelists.find((d) => d.isBoss);
    console.log(`\nTier ${t.number}:`);
    for (const d of t.duelists) {
      const others = t.duelists.filter((o) => o.key !== d.key);
      const avg = others.reduce((s, o) => s + rate(d.key, o.key), 0) / Math.max(1, others.length);
      console.log(`  ${pct(avg)}  ${d.key}${d.isBoss ? ' (chefe)' : d.isFinal ? ' (final)' : ''}  ${others.map((o) => `${o.key} ${pct(rate(d.key, o.key))}`).join(', ')}`);
    }
    if (boss) {
      const regs = t.duelists.filter((d) => !d.isBoss && !d.isFinal);
      const avg = regs.reduce((s, d) => s + rate(boss.key, d.key), 0) / Math.max(1, regs.length);
      console.log(`  Chefe ${boss.name} contra os comuns: ${pct(avg)}`);
      if (avg <= 0.5) fail = true;
      const final = t.duelists.find((d) => d.isFinal);
      if (final) {
        const r = rate(final.key, boss.key);
        console.log(`  Final ${final.name} contra o chefe: ${pct(r)}`);
        if (r <= 0.5) fail = true;
      }
    }
  }
  if (fail) { console.log('ALERTA: um chefe não vence a maioria contra os comuns do tier (ou o final, contra o chefe)'); process.exitCode = 1; }
}
