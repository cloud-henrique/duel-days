/// <reference lib="webworker" />
import { OcgMessageType, OcgProcessResult, OcgResponseType, type OcgCardData, type OcgMessage } from 'ocgcore-wasm';
import { cpuRespond, freePlaces, isSelect, makeRng } from './cpu';
import { openCore, startDuel, type CardRecord, type DuelSession } from './session';
import { Narrator } from './narrator';
import { RETRY_NOTICE, type FromWorker, type ToWorker } from './protocol';

const post = (m: FromWorker) => postMessage(m);
const UI_PROMPTS = new Set<number>([
  OcgMessageType.SELECT_IDLECMD, OcgMessageType.SELECT_BATTLECMD, OcgMessageType.SELECT_CHAIN, OcgMessageType.SELECT_EFFECTYN,
  OcgMessageType.SELECT_YESNO, OcgMessageType.SELECT_OPTION, OcgMessageType.SELECT_CARD, OcgMessageType.SELECT_TRIBUTE,
  OcgMessageType.SELECT_UNSELECT_CARD, OcgMessageType.SELECT_POSITION,
]);
let cardCache: OcgCardData[] | null = null;
const cardList = () => (cardCache ??= Object.values(cards).map((c) => ({ ...c, race: BigInt(c.race) }) as OcgCardData));
let session: DuelSession | null = null;
let lastPrompt: OcgMessage | null = null;
let autoPass = false;
let cards: Record<string, CardRecord> = {};
const rng = makeRng(7);
const narrator = new Narrator((code) => cards[String(code)]?.name ?? `#${code}`);

async function loadAssets(base: string) {
  cards = await (await fetch(`${base}data/cards.json`)).json();
  try {
    const pt: Record<string, { name: string }> = await (await fetch(`${base}data/text.pt.json`)).json();
    for (const [id, t] of Object.entries(pt)) if (cards[id]) cards[id].name = t.name;
  } catch { /* sem tradução */ }
  const bundle: Record<string, string> = await (await fetch(`${base}scripts.json`)).json();
  const scripts = new Map<string, string>(Object.entries(bundle));
  return scripts;
}

/** Roda o duelo até precisar da resposta do humano (jogador 0). A CPU (jogador 1) responde aqui dentro. */
function run() {
  const s = session!;
  const events: string[] = [];
  for (let guard = 0; guard < 20000; guard++) {
    const { status, messages } = s.step();
    let winner: number | null = null;
    for (const m of messages) { narrator.describe(m, events, s); if (m.type === OcgMessageType.WIN) winner = m.player; }
    if (winner !== null || status === OcgProcessResult.END) {
      post({ t: 'end', winner: winner ?? -1, board: narrator.snapshot(s), events });
      return;
    }
    const sel = [...messages].reverse().find(isSelect);
    if (!sel || !('player' in sel)) {
      // Resposta rejeitada pelo motor: pede de novo o mesmo comando em vez de travar.
      if (messages.some((m) => m.type === OcgMessageType.RETRY) && lastPrompt) {
        post({ t: 'prompt', msg: lastPrompt, board: narrator.snapshot(s), events: [...events, RETRY_NOTICE] });
        return;
      }
      post({ t: 'error', text: `O duelo parou sem pedir resposta. Mensagens: ${messages.map((m) => OcgMessageType[m.type] ?? m.type).join(', ') || '(nenhuma)'}` });
      return;
    }
    // Correntes sem nada a ativar: responde "não" sem incomodar o jogador.
    if (sel.type === OcgMessageType.SELECT_CHAIN && !sel.forced && (sel.selects.length === 0 || (autoPass && sel.player === 0))) {
      s.respond({ type: OcgResponseType.SELECT_CHAIN, index: null });
      continue;
    }
    // Zona: por enquanto a primeira livre (escolha manual vem depois), sem pedir confirmação.
    if (sel.player === 0 && (sel.type === OcgMessageType.SELECT_PLACE || sel.type === OcgMessageType.SELECT_DISFIELD)) {
      s.respond({ type: sel.type === OcgMessageType.SELECT_PLACE ? OcgResponseType.SELECT_PLACE : OcgResponseType.SELECT_DISFIELD, places: freePlaces(sel.field_mask, sel.player, sel.count) });
      continue;
    }
    // Prompts que a interface ainda não trata (anunciar, ordenar, contadores, soma...): responde automaticamente.
    if (sel.player === 0 && !UI_PROMPTS.has(sel.type)) {
      const auto = cpuRespond(sel, rng, { cards: cardList() });
      if (auto) { s.respond(auto); continue; }
    }
    if (sel.player === 0) { lastPrompt = sel; post({ t: 'prompt', msg: sel, board: narrator.snapshot(s), events }); return; }
    const r = cpuRespond(sel, rng, { cards: cardList() });
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
      narrator.reset();
      autoPass = false;
      session = startDuel(core, { cards, script: (n) => scripts.get(n) ?? null }, [d.mine, d.foe], { seed: BigInt(d.seed), log: (t) => console.warn(t) });
      post({ t: 'ready', version: core.getVersion() as [number, number], loadMs: Math.round(performance.now() - t0) });
      run();
    } else if (d.t === 'autoPass') {
      autoPass = d.value;
    } else if (d.t === 'respond' && session) {
      session.respond(d.response);
      run();
    }
  } catch (e) {
    post({ t: 'error', text: String((e as Error)?.stack ?? e) });
  }
};
