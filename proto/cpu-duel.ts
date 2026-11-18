// Duelo inteiro com a CPU nova dos dois lados (change `cpu-estrategica`) e um executor que reparte duelos entre vários
// processos (cada duelo com busca leva segundos). Usado pela `difficulty.ts`, `deck-pick.ts` e `tier-balance.ts`.
import { fork, type ChildProcess } from 'node:child_process';
import { cpus } from 'node:os';
import { readFileSync } from 'node:fs';
import { DuelDriver, type DriverOptions } from '../src/engine/driver';
import { PROFILES, type CpuKind } from '../src/engine/search';
import { openCore, type CardRecord, type DeckList } from '../src/engine/session';

type Core = Awaited<ReturnType<typeof openCore>>;
let env: { core: Core; cards: Record<string, CardRecord>; scripts: Record<string, string> } | null = null;
async function engine() {
  env ??= {
    core: await openCore(),
    cards: JSON.parse(readFileSync('public/data/cards.json', 'utf8')),
    scripts: JSON.parse(readFileSync('public/scripts.json', 'utf8')),
  };
  return env;
}

export interface DuelResult { winner: number; turns: number }

/**
 * Um duelo: o jogador 0 (começa) com `a` no perfil `kindA`, o 1 com `b` no `kindB`, os dois pela busca com o mesmo
 * orçamento. `winner`: 0, 1, ou −1 (empate, erro ou limite de jogadas).
 */
export async function cpuDuel(a: DeckList, kindA: CpuKind, b: DeckList, kindB: CpuKind, seed: number,
  budget: NonNullable<DriverOptions['budget']>): Promise<DuelResult> {
  const { core, cards, scripts } = await engine();
  const d = new DuelDriver(core, cards, (n) => scripts[n] ?? null, a, b, seed, undefined, { cpu: kindB, budget });
  const p0 = { ...PROFILES[kindA], ...budget };
  try {
    let out = d.run();
    for (let k = 0; k < 4000 && out.t === 'prompt'; k++) {
      const r = d.think(out.msg, p0) ?? d.cheap(out.msg);
      if (!r) break;
      out = d.respond(r);
    }
    if (out.t === 'error') console.error(`erro (seed ${seed}): ${out.text.slice(0, 200)}`);
    const turns = out.t === 'end' || out.t === 'prompt' ? out.board.turn : 0;
    return { winner: out.t === 'end' && (out.winner === 0 || out.winner === 1) ? out.winner : -1, turns };
  } finally {
    d.session.destroy();
  }
}

/**
 * Reparte `jobs` entre processos filhos (o próprio script, com `PAR_CHILD=1`) e devolve os resultados na ordem. O
 * script chama `serveChild(work)` quando é filho. `procs` padrão: núcleos − 1.
 */
export function parallel<J, R>(jobs: J[], procs = Math.max(1, cpus().length - 1), onDone?: (n: number) => void): Promise<R[]> {
  const out: R[] = new Array(jobs.length);
  let next = 0, done = 0;
  return new Promise((resolve, reject) => {
    if (!jobs.length) { resolve(out); return; }
    const kids: ChildProcess[] = [];
    const feed = (k: ChildProcess) => {
      if (next >= jobs.length) { k.kill(); return; }
      const i = next++;
      k.send({ i, job: jobs[i] });
    };
    for (let p = 0; p < Math.min(procs, jobs.length); p++) {
      const k = fork(process.argv[1], process.argv.slice(2), { execArgv: process.execArgv, env: { ...process.env, PAR_CHILD: '1' } });
      kids.push(k);
      k.on('message', (m: { i: number; r: R }) => {
        out[m.i] = m.r; done++; onDone?.(done);
        if (done === jobs.length) { kids.forEach((x) => x.kill()); resolve(out); } else feed(k);
      });
      k.on('error', reject);
      feed(k);
    }
  });
}

export const isChild = () => process.env.PAR_CHILD === '1';

/** No processo filho: responde cada trabalho com `work`. */
export function serveChild<J, R>(work: (job: J) => Promise<R>) {
  process.on('message', async (m: { i: number; job: J }) => {
    const r = await work(m.job);
    process.send!({ i: m.i, r });
  });
}
