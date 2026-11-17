// "Jogador macaco": duelos completos com o MESMO código do Worker (DuelDriver), contra os decks reais dos personagens,
// da campanha (do nativo), com o jogador usando o deck inicial da campanha. Mede erros, laços e o tempo máximo de uma resposta.
// Uso: npx tsx proto/monkey.ts [duelosPorOponente=100] [seedInicial=1]
import { readFileSync } from 'node:fs';
import { cpuRespond, makeRng } from '../src/engine/cpu';
import { DuelDriver } from '../src/engine/driver';
import { openCore, type CardRecord } from '../src/engine/session';
import { DUELISTS } from '../src/campaign/data/types';
import { duelistDeck, starterDeck } from '../src/campaign/decks';
import type { OcgMessage } from 'ocgcore-wasm';
import { checkLocs, lastBoardMatches, turnTimer, LONG_TURN_MS } from './beat-check';
import type { DriverOut } from '../src/engine/driver';

const N = Number(process.argv[2] ?? 100), SEED0 = Number(process.argv[3] ?? 1);
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
const core = await openCore();
const res = { fim: 0, erro: 0, limite: 0 };
const errors: string[] = [];
let worstMs = 0, worst = '';
// Beats (change `animar-duelo`): lugares válidos e o último retrato dos steps igual ao tabuleiro final.
const beat = { steps: 0, locErr: 0, boardOk: 0, boardErr: 0, turnosLongos: 0 };
const longTurns: string[] = [];
let timer = turnTimer();
let maxTurnMs = 0, totalTurns = 0;
const beatErrors: string[] = [];
const checkOut = (out: DriverOut, where: string) => {
  if (out.t !== 'prompt' && out.t !== 'end') return;
  beat.steps += out.steps.length;
  timer.add(out.steps);
  for (const e of checkLocs(out.steps)) { beat.locErr++; if (beatErrors.length < 10) beatErrors.push(`${where}: ${e}`); }
  const ok = lastBoardMatches(out.steps, out.board);
  if (ok === true) beat.boardOk++;
  else if (ok === false) { beat.boardErr++; if (beatErrors.length < 10) beatErrors.push(`${where}: último retrato difere do tabuleiro final`); }
};
for (const opp of DUELISTS.map((d) => d.key)) {
  const foe = duelistDeck(opp);
  for (let i = 0; i < N; i++) {
    const seed = SEED0 + i;
    // Metade dos duelos com o deck inicial, metade com o deck de outro duelista (cobre as cartas dos dois lados).
    const others = DUELISTS.map((d) => d.key).filter((k) => k !== opp);
    const mine = i % 2 === 0 ? starterDeck() : duelistDeck(others[i % others.length]);
    const d = new DuelDriver(core, cards, (n) => scripts[n] ?? null, mine, foe, seed);
    const rng = makeRng(seed * 13);
    timer = turnTimer();
    let t = Date.now(); let out = d.run(); let ms = Date.now() - t;
    checkOut(out, `${opp} seed ${seed} início`);
    let k = 0;
    for (; k < 3000 && out.t === 'prompt'; k++) {
      if (rng() < 0.05) d.autoPass = !d.autoPass;
      const r = cpuRespond(out.msg as OcgMessage, rng, {});
      if (!r) { out = { t: 'error', text: `macaco sem resposta para ${out.msg.type}` }; break; }
      t = Date.now(); out = d.respond(r); ms = Date.now() - t;
      checkOut(out, `${opp} seed ${seed} jogada ${k}`);
      if (ms > worstMs) { worstMs = ms; worst = `${opp} seed ${seed} jogada ${k}`; }
    }
    const longs = timer.end(); totalTurns += timer.count;
    for (const l of longs) { beat.turnosLongos++; maxTurnMs = Math.max(maxTurnMs, l.ms); if (longTurns.length < 5) longTurns.push(`${opp} seed ${seed} turno ${l.turn}: ${(l.ms / 1000).toFixed(1)}s`); }
    if (out.t === 'end') res.fim++;
    else if (out.t === 'error') { res.erro++; errors.push(`${opp} seed ${seed}: ${out.text.slice(0, 300)}`); }
    else res.limite++;
    d.session.destroy();
  }
}
console.log(res, `| resposta mais lenta: ${worstMs} ms (${worst})`);
errors.slice(0, 10).forEach((e) => console.log('ERRO', e));
console.log('beats:', beat);
beatErrors.forEach((e) => console.log('BEAT', e));
if (beat.turnosLongos) console.log(`ALERTA: ${beat.turnosLongos} de ${totalTurns} turnos acima de ${LONG_TURN_MS / 1000}s de encenação (máx. ${(maxTurnMs / 1000).toFixed(1)}s)`, longTurns);
if (res.erro || beat.locErr || beat.boardErr) process.exitCode = 1;
