import { OcgMessageType, OcgProcessResult, OcgResponseType, type OcgCardData, type OcgCoreSync, type OcgMessage, type OcgResponse } from 'ocgcore-wasm';
import { cpuRespond, freePlaces, isSelect, makeRng } from './cpu';
import { Narrator } from './narrator';
import { RETRY_NOTICE, type FromWorker } from './protocol';
import { startDuel, type CardRecord, type DeckList, type DuelSession } from './session';

/** Prompts que a interface sabe mostrar ao jogador; os demais são respondidos automaticamente. */
export const UI_PROMPTS = new Set<number>([
  OcgMessageType.SELECT_IDLECMD, OcgMessageType.SELECT_BATTLECMD, OcgMessageType.SELECT_CHAIN, OcgMessageType.SELECT_EFFECTYN,
  OcgMessageType.SELECT_YESNO, OcgMessageType.SELECT_OPTION, OcgMessageType.SELECT_CARD, OcgMessageType.SELECT_TRIBUTE,
  OcgMessageType.SELECT_UNSELECT_CARD, OcgMessageType.SELECT_POSITION, OcgMessageType.SORT_CARD,
]);
export type DriverOut = Exclude<FromWorker, { t: 'ready' }>;

/** Limites para um laço do motor virar erro visível em vez de travar a tela. */
const MAX_STEPS = 4000;
const MAX_MS = 5000;

/**
 * Conduz um duelo: avança o motor, responde pela CPU (jogador 1) e pelos prompts automáticos, e para quando
 * precisa do jogador 0. É o mesmo código no Worker e nos testes em Node.
 */
export class DuelDriver {
  readonly session: DuelSession;
  autoPass = false;
  private narrator: Narrator;
  private lastPrompt: OcgMessage | null = null;
  private rng = makeRng(7);
  private cardList: OcgCardData[];
  /** Rastreamento opcional (modo diagnóstico). */
  trace: ((t: string) => void) | null = null;
  /** Últimos tipos de mensagem (para diagnóstico). */
  private trail: string[] = [];

  constructor(core: OcgCoreSync, private cards: Record<string, CardRecord>, script: (name: string) => string | null,
    mine: DeckList, foe: DeckList, seed: number, log?: (t: string) => void) {
    this.narrator = new Narrator((code) => cards[String(code)]?.name ?? `#${code}`);
    this.cardList = Object.values(cards).map((c) => ({ ...c, race: BigInt(c.race) }) as OcgCardData);
    this.session = startDuel(core, { cards, script }, [mine, foe], { seed: BigInt(seed), log });
  }

  respond(r: OcgResponse): DriverOut {
    this.trace?.('setResponse…');
    this.session.respond(r);
    this.trace?.('setResponse ok');
    return this.run();
  }

  private note(label: string) { this.trail.push(label); if (this.trail.length > 16) this.trail.shift(); }
  private diag() { return `Últimos passos: ${this.trail.join(' → ') || '(nenhum)'}`; }

  run(): DriverOut {
    const s = this.session;
    const events: string[] = [];
    this.narrator.shows = [];
    const shows = () => this.narrator.shows.slice(-3);
    const t0 = Date.now();
    for (let n = 0; ; n++) {
      if (n >= MAX_STEPS || Date.now() - t0 > MAX_MS) return { t: 'error', text: `O motor entrou em laço (${n} passos, ${Date.now() - t0} ms). ${this.diag()}` };
      this.trace?.(`step ${n}…`);
      const { status, messages } = s.step();
      this.trace?.(`step ${n}: status ${status}, ${messages.length} msgs [${messages.slice(-4).map((m) => OcgMessageType[m.type]).join(',')}]`);
      let winner: number | null = null;
      for (const m of messages) { this.narrator.describe(m, events, s); if (m.type === OcgMessageType.WIN) winner = m.player; }
      if (winner !== null || status === OcgProcessResult.END) return { t: 'end', winner: winner ?? -1, board: this.narrator.snapshot(s), events, shows: shows() };
      const sel = [...messages].reverse().find(isSelect);
      if (!sel || !('player' in sel)) {
        // Resposta rejeitada: pede de novo o mesmo comando em vez de travar.
        if (messages.some((m) => m.type === OcgMessageType.RETRY) && this.lastPrompt) {
          this.note('RETRY');
          return { t: 'prompt', msg: this.lastPrompt, board: this.narrator.snapshot(s), events: [...events, RETRY_NOTICE] };
        }
        return { t: 'error', text: `O duelo parou sem pedir resposta. Mensagens: ${messages.map((m) => OcgMessageType[m.type] ?? m.type).join(', ') || '(nenhuma)'}. ${this.diag()}` };
      }
      this.note(`${OcgMessageType[sel.type]}@${sel.player}`);
      // Correntes opcionais sem nada a ativar (ou com "não perguntar mais"): responde "não".
      if (sel.type === OcgMessageType.SELECT_CHAIN && !sel.forced && (sel.selects.length === 0 || (this.autoPass && sel.player === 0))) {
        s.respond({ type: OcgResponseType.SELECT_CHAIN, index: null });
        continue;
      }
      // Zona: a primeira livre (escolha manual vem depois).
      if (sel.player === 0 && (sel.type === OcgMessageType.SELECT_PLACE || sel.type === OcgMessageType.SELECT_DISFIELD)) {
        s.respond({ type: sel.type === OcgMessageType.SELECT_PLACE ? OcgResponseType.SELECT_PLACE : OcgResponseType.SELECT_DISFIELD, places: freePlaces(sel.field_mask, sel.player, sel.count) });
        continue;
      }
      if (sel.player === 0 && !UI_PROMPTS.has(sel.type)) {
        const auto = cpuRespond(sel, this.rng, { cards: this.cardList });
        if (auto) { s.respond(auto); continue; }
      }
      if (sel.player === 0) { this.lastPrompt = sel; return { t: 'prompt', msg: sel, board: this.narrator.snapshot(s), events, shows: shows() }; }
      const r = cpuRespond(sel, this.rng, { cards: this.cardList });
      if (!r) return { t: 'error', text: `CPU sem resposta para ${OcgMessageType[sel.type]}. ${this.diag()}` };
      s.respond(r);
    }
  }
}
