// Medida de dificuldade (change `cpu-estrategica`): cada duelista da campanha contra o deck inicial, com a CPU nova dos
// dois lados (o duelista no perfil dele, o deck inicial no comum), trocando quem começa. Mostra a taxa de vitória do
// duelista, a meta do tier e quem está fora da meta por mais de 10 pontos.
// Uso: npx tsx proto/difficulty.ts [duelosPorDuelista=20] [--cpu=busca[:N]] [--so=rex,mai] [--procs=N]
import { DUELISTS } from '../src/campaign/data/types';
import { cpuFor, duelistDeck, starterDeck } from '../src/campaign/decks';
import { tierOfDuelist } from '../src/campaign/data/types';
import { cpuDuel, isChild, parallel, serveChild, type DuelResult } from './cpu-duel';
import { cpuMode } from './cpu-mode';
import { targetFor } from './difficulty-target';

const flag = (name: string) => {
  const i = process.argv.findIndex((a) => a.startsWith(`--${name}=`));
  return i >= 0 ? process.argv.splice(i, 1)[0].split('=')[1] : undefined;
};
const MODE = cpuMode('busca:16');
const ONLY = flag('so')?.split(',');
const PROCS = flag('procs');
const N = Number(process.argv[2] ?? 20);


interface Job { key: string; i: number }

async function work({ key, i }: Job): Promise<{ key: string; won: boolean | null; turns: number }> {
  const seed = 5000 + i * 7;
  const swap = i % 2 === 1; // ímpar: o duelista começa (é o jogador 0)
  const kind = cpuFor(key);
  const r: DuelResult = swap
    ? await cpuDuel(duelistDeck(key), kind, starterDeck(), 'comum', seed, MODE.budget)
    : await cpuDuel(starterDeck(), 'comum', duelistDeck(key), kind, seed, MODE.budget);
  const duelistSide = swap ? 0 : 1;
  return { key, won: r.winner < 0 ? null : r.winner === duelistSide, turns: r.turns };
}

if (isChild()) serveChild(work);
else {
  const keys = DUELISTS.map((d) => d.key).filter((k) => !ONLY || ONLY.includes(k));
  const jobs: Job[] = keys.flatMap((key) => Array.from({ length: N }, (_, i) => ({ key, i })));
  console.log(`${MODE.label}; ${N} duelos por duelista contra o deck inicial (${jobs.length} duelos)`);
  const t0 = Date.now();
  const res = await parallel<Job, Awaited<ReturnType<typeof work>>>(jobs, PROCS ? Number(PROCS) : undefined, (n) => {
    if (n % 20 === 0) process.stdout.write(`  ${n}/${jobs.length} (${Math.round((Date.now() - t0) / 1000)} s)\n`);
  });
  const lines: string[] = [];
  let off = 0;
  for (const key of keys) {
    const mine = res.filter((r) => r.key === key);
    const valid = mine.filter((r) => r.won != null);
    const rate = valid.length ? valid.filter((r) => r.won).length / valid.length : 0;
    const target = targetFor(key);
    const diff = Math.round((rate - target) * 100);
    const out = Math.abs(diff) > 10;
    if (out) off++;
    const turns = Math.round(mine.reduce((a, r) => a + r.turns, 0) / Math.max(1, mine.length));
    lines.push(`${key.padEnd(9)} T${tierOfDuelist(key)?.number}${cpuFor(key) === 'chefe' ? ' chefe' : '      '}  ${(rate * 100).toFixed(0).padStart(3)}%  meta ${(target * 100).toFixed(0)}%  ${diff >= 0 ? '+' : ''}${diff}  ${out ? 'FORA DA META' : 'ok'}  (${valid.length} duelos, ${mine.length - valid.length} sem vencedor, ~${turns} turnos)`);
  }
  console.log(lines.join('\n'));
  console.log(`${off} de ${keys.length} fora da meta (±10 pontos). ${Math.round((Date.now() - t0) / 1000)} s.`);
}
