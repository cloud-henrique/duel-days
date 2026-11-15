/// <reference lib="webworker" />
import { OcgLocation, OcgMessageType, OcgProcessResult, OcgQueryFlags, OcgResponseType, type OcgMessage } from 'ocgcore-wasm';
import { cpuRespond, freePlaces, isSelect, makeRng } from './cpu';
import { openCore, startDuel, type CardRecord, type DuelSession } from './session';
import type { Board, BoardCard, FromWorker, PlayerBoard, ToWorker } from './protocol';

const post = (m: FromWorker) => postMessage(m);
let session: DuelSession | null = null;
let cards: Record<string, CardRecord> = {};
const lp: [number, number] = [8000, 8000];
let turn = 0, turnPlayer = 0, phase = 0;
const rng = makeRng(7);
const nm = (code: number) => cards[String(code)]?.name ?? `#${code}`;

async function loadAssets(base: string) {
  cards = await (await fetch(`${base}data/cards.json`)).json();
  try {
    const pt: Record<string, { name: string }> = await (await fetch(`${base}data/text.pt.json`)).json();
    for (const [id, t] of Object.entries(pt)) if (cards[id]) cards[id].name = t.name;
  } catch { /* sem tradução */ }
  const names: string[] = await (await fetch(`${base}scripts/index.json`)).json();
  const scripts = new Map<string, string>();
  await Promise.all(names.map(async (n) => scripts.set(n, await (await fetch(`${base}scripts/${n}`)).text())));
  return scripts;
}

function snapshot(s: DuelSession): Board {
  const q = (controller: 0 | 1, location: OcgLocation): (BoardCard | null)[] =>
    s.core.duelQueryLocation(s.handle, { flags: (OcgQueryFlags.CODE | OcgQueryFlags.POSITION | OcgQueryFlags.ATTACK | OcgQueryFlags.DEFENSE) as OcgQueryFlags, controller, location }).map((c) =>
      c && c.code ? { code: c.code, position: c.position ?? 0, attack: c.attack, defense: c.defense } : null);
  const pb = (p: 0 | 1): PlayerBoard => ({
    lp: lp[p],
    deck: s.core.duelQueryCount(s.handle, p, OcgLocation.DECK),
    hand: q(p, OcgLocation.HAND).filter(Boolean) as BoardCard[],
    mzone: q(p, OcgLocation.MZONE),
    szone: q(p, OcgLocation.SZONE),
    grave: q(p, OcgLocation.GRAVE).filter(Boolean) as BoardCard[],
  });
  return { players: [pb(0), pb(1)], turn, turnPlayer, phase };
}

const who = (p: number) => (p === 0 ? 'Você' : 'Oponente');
function describe(m: OcgMessage, out: string[]) {
  switch (m.type) {
    case OcgMessageType.NEW_TURN: turn++; turnPlayer = m.player; out.push(`— Turno ${turn} (${who(m.player)}) —`); break;
    case OcgMessageType.NEW_PHASE: phase = m.phase; break;
    case OcgMessageType.DRAW: if (m.player === 0) m.drawn.forEach((d) => out.push(`Você comprou ${nm(d.code)}`)); else out.push('Oponente comprou uma carta'); break;
    case OcgMessageType.SUMMONING: case OcgMessageType.SPSUMMONING: out.push(`${who(m.controller)} invocou ${nm(m.code)}`); break;
    case OcgMessageType.SET: out.push(`${who(m.controller)} baixou uma carta`); break;
    case OcgMessageType.ATTACK: out.push(`${who(m.card.controller)} ataca com ${nm(cardCode(m.card.controller, m.card.location, m.card.sequence))}`); break;
    case OcgMessageType.CHAINING: out.push(`${who(m.controller)} ativou ${nm(m.code)}`); break;
    case OcgMessageType.DAMAGE: lp[m.player] -= m.amount; out.push(`${who(m.player)} perdeu ${m.amount} LP`); break;
    case OcgMessageType.RECOVER: lp[m.player] += m.amount; out.push(`${who(m.player)} recuperou ${m.amount} LP`); break;
    case OcgMessageType.PAY_LPCOST: lp[m.player] -= m.amount; out.push(`${who(m.player)} pagou ${m.amount} LP`); break;
    case OcgMessageType.LPUPDATE: lp[m.player] = m.lp; break;
    case OcgMessageType.WIN: out.push(m.player === 0 ? 'Você venceu!' : 'O oponente venceu.'); break;
  }
}
function cardCode(controller: number, location: OcgLocation, sequence: number) {
  const c = session!.core.duelQuery(session!.handle, { flags: 1, controller: controller as 0 | 1, location, sequence, overlaySequence: 0 });
  return c?.code ?? 0;
}

/** Roda o duelo até precisar da resposta do humano (jogador 0). A CPU (jogador 1) responde aqui dentro. */
function run() {
  const s = session!;
  const events: string[] = [];
  for (let guard = 0; guard < 20000; guard++) {
    const { status, messages } = s.step();
    let winner: number | null = null;
    for (const m of messages) { describe(m, events); if (m.type === OcgMessageType.WIN) winner = m.player; }
    if (winner !== null || status === OcgProcessResult.END) {
      post({ t: 'end', winner: winner ?? -1, board: snapshot(s), events });
      return;
    }
    const sel = [...messages].reverse().find(isSelect);
    if (!sel || !('player' in sel)) { post({ t: 'error', text: 'duelo parou sem pedir resposta' }); return; }
    // Correntes sem nada a ativar: responde "não" sem incomodar o jogador.
    if (sel.type === OcgMessageType.SELECT_CHAIN && !sel.forced && sel.selects.length === 0) {
      s.respond({ type: OcgResponseType.SELECT_CHAIN, index: null });
      continue;
    }
    // Zona: por enquanto a primeira livre (escolha manual vem depois), sem pedir confirmação.
    if (sel.player === 0 && (sel.type === OcgMessageType.SELECT_PLACE || sel.type === OcgMessageType.SELECT_DISFIELD)) {
      s.respond({ type: sel.type === OcgMessageType.SELECT_PLACE ? OcgResponseType.SELECT_PLACE : OcgResponseType.SELECT_DISFIELD, places: freePlaces(sel.field_mask, sel.player, sel.count) });
      continue;
    }
    if (sel.player === 0) { post({ t: 'prompt', msg: sel, board: snapshot(s), events }); return; }
    const r = cpuRespond(sel, rng);
    if (!r) { post({ t: 'error', text: `CPU sem resposta para mensagem ${sel.type}` }); return; }
    s.respond(r);
  }
  post({ t: 'error', text: 'limite de passos excedido' });
}

onmessage = async (ev: MessageEvent<ToWorker>) => {
  const d = ev.data;
  try {
    if (d.t === 'start') {
      const t0 = performance.now();
      session?.destroy();
      const scripts = await loadAssets(d.base);
      const core = await openCore();
      lp[0] = lp[1] = 8000; turn = 0;
      const deck2 = d.deck.slice().reverse();
      session = startDuel(core, { cards, script: (n) => scripts.get(n) ?? null }, [d.deck, deck2], { seed: BigInt(d.seed), log: (t) => console.warn(t) });
      post({ t: 'ready', version: core.getVersion() as [number, number], loadMs: Math.round(performance.now() - t0) });
      run();
    } else if (d.t === 'respond' && session) {
      session.respond(d.response);
      run();
    }
  } catch (e) {
    post({ t: 'error', text: String((e as Error)?.stack ?? e) });
  }
};
