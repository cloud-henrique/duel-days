// Confere a resposta de SORT_CARD contra o motor real: ativa "Classificar Livro de Magia" no 1º turno.
// Depois, só passa os turnos: as três compras seguintes têm de sair na ordem escolhida.
// Uso: npx tsx proto/sort-check.ts
import { readFileSync } from 'node:fs';
import { OcgMessageType, OcgResponseType, SelectIdleCMDAction, type OcgMessage, type OcgResponse } from 'ocgcore-wasm';
import { randomRespond, makeRng } from '../src/engine/cpu';
import { DuelDriver } from '../src/engine/driver';
import { openCore, type CardRecord } from '../src/engine/session';
import { sortResponseOrder } from '../src/screens/duel/sort';

const SORT_BOOK = 96677818;
const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const scripts = JSON.parse(readFileSync('public/scripts.json', 'utf8')) as Record<string, string>;
// Monstros Normais distintos, para cada carta do topo ser reconhecível pelo código.
const normals = Object.values(cards).filter((c) => c.type === 0x11).slice(0, 30).map((c) => c.code);
const mine = { main: [...Array<number>(10).fill(SORT_BOOK), ...normals], extra: [] };
const foe = { main: normals.slice(0, 40), extra: [] };

const core = await openCore();
const rng = makeRng(1);
const nameOf = (code: number) => cards[String(code)]?.name;
let chosen: number[] | null = null;
const draws: string[] = [];
const d = new DuelDriver(core, cards, (n) => scripts[n] ?? null, mine, foe, 1);
let out = d.run();
for (let k = 0; k < 400 && out.t === 'prompt' && draws.length < 3; k++) {
  // As compras do jogador vêm nos beats `draw` dos steps que acompanham o pedido.
  if (chosen) for (const { beat } of out.steps) if (beat.k === 'draw' && beat.p === 0) draws.push(...beat.codes.map((c) => nameOf(c) ?? String(c)));
  const m: OcgMessage = out.msg;
  if (m.type === OcgMessageType.SORT_CARD && !chosen) {
    const codes = m.cards.map((c) => c.code);
    // Mostrado: a última carta vai para o topo, depois a primeira, depois a do meio.
    const display = [2, 0, 1];
    chosen = display.map((i) => codes[i]);
    console.log('topo antes:', codes.map(nameOf));
    out = d.respond({ type: OcgResponseType.SORT_CARD, order: sortResponseOrder(display) });
    continue;
  }
  if (m.type === OcgMessageType.SELECT_IDLECMD && !chosen) {
    const i = m.activates.findIndex((a) => a.code === SORT_BOOK);
    if (i >= 0) { out = d.respond({ type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.SELECT_ACTIVATE, index: i }); continue; }
  }
  // Depois de ordenar, não ativa mais nada: só passa os turnos, para as compras saírem do topo.
  const r = m.type === OcgMessageType.SELECT_IDLECMD && chosen && m.to_ep ? { type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.TO_EP, index: null } as OcgResponse : randomRespond(m, rng, {});
  if (!r) break;
  out = d.respond(r);
}
d.session.destroy();
const want = (chosen ?? []).map(nameOf);
const ok = JSON.stringify(draws) === JSON.stringify(want);
console.log({ escolhido: want, compras: draws, ok });
process.exit(ok ? 0 : 1);
