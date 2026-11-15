// "Jogador macaco": duelos completos com o MESMO código do Worker (DuelDriver), contra os decks reais dos personagens,
// com o jogador usando decks iniciais. Mede erros, laços e o tempo máximo de uma resposta.
// Uso: npx tsx proto/monkey.ts [duelosPorOponente=100] [seedInicial=1]
import { readFileSync } from 'node:fs';
import { cpuRespond, makeRng } from '../src/engine/cpu';
import { DuelDriver } from '../src/engine/driver';
import { openCore, type CardRecord } from '../src/engine/session';
import { randomDeck, starterCollection } from '../src/game/decks';
import type { OcgMessage } from 'ocgcore-wasm';

const N = Number(process.argv[2] ?? 100), SEED0 = Number(process.argv[3] ?? 1);
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
const tiers = JSON.parse(readFileSync('public/data/pool.json', 'utf8')) as Record<string, string>;
const poolIds = Object.keys(tiers).map(Number);
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const core = await openCore();
const res = { fim: 0, erro: 0, limite: 0 };
const errors: string[] = [];
let worstMs = 0, worst = '';
for (const opp of ['joey_wheeler', 'bakura', 'seto_kaiba']) {
  const foe = randomDeck(cards, poolIds, hash(opp));
  for (let i = 0; i < N; i++) {
    const seed = SEED0 + i;
    const col = starterCollection(cards, tiers, seed * 7);
    const mine = { main: Object.entries(col).flatMap(([id, n]) => Array<number>(n).fill(Number(id))), extra: [] };
    const d = new DuelDriver(core, cards, (n) => scripts[n] ?? null, mine, foe, seed);
    const rng = makeRng(seed * 13);
    let t = Date.now(); let out = d.run(); let ms = Date.now() - t;
    let k = 0;
    for (; k < 3000 && out.t === 'prompt'; k++) {
      if (rng() < 0.05) d.autoPass = !d.autoPass;
      const r = cpuRespond(out.msg as OcgMessage, rng, {});
      if (!r) { out = { t: 'error', text: `macaco sem resposta para ${out.msg.type}` }; break; }
      t = Date.now(); out = d.respond(r); ms = Date.now() - t;
      if (ms > worstMs) { worstMs = ms; worst = `${opp} seed ${seed} jogada ${k}`; }
    }
    if (out.t === 'end') res.fim++;
    else if (out.t === 'error') { res.erro++; errors.push(`${opp} seed ${seed}: ${out.text.slice(0, 300)}`); }
    else res.limite++;
    d.session.destroy();
  }
}
console.log(res, `| resposta mais lenta: ${worstMs} ms (${worst})`);
errors.slice(0, 10).forEach((e) => console.log('ERRO', e));
