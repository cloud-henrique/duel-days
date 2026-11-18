import { OcgMessageType, OcgProcessResult, OcgResponseType, type OcgCardData, type OcgCoreSync, type OcgMessage, type OcgResponse } from 'ocgcore-wasm';
import { cpuRespond, freePlaces, isSelect, newMemory, type PolicyMemory } from './cpu';
import { Narrator } from './narrator';
import { RETRY_NOTICE, type FromWorker, type Step } from './protocol';
import { decide, PROFILES, type CpuKind, type CpuProfile, type ForkSource, type SearchStats } from './search';
import { forkDuel, startDuel, type CardRecord, type DeckList, type DuelOptions, type DuelSession, type PlacedCard } from './session';

/** Prompts que a interface sabe mostrar ao jogador; os demais são respondidos automaticamente. */
export const UI_PROMPTS = new Set<number>([
  OcgMessageType.SELECT_IDLECMD, OcgMessageType.SELECT_BATTLECMD, OcgMessageType.SELECT_CHAIN, OcgMessageType.SELECT_EFFECTYN,
  OcgMessageType.SELECT_YESNO, OcgMessageType.SELECT_OPTION, OcgMessageType.SELECT_CARD, OcgMessageType.SELECT_TRIBUTE,
  OcgMessageType.SELECT_UNSELECT_CARD, OcgMessageType.SELECT_POSITION, OcgMessageType.SORT_CARD,
]);
export type DriverOut = Exclude<FromWorker, { t: 'ready' | 'steps' }>;

/** Limites para um laço do motor virar erro visível em vez de travar a tela (o tempo de pensar da CPU não conta). */
const MAX_STEPS = 4000;
const MAX_MS = 5000;

export interface DriverOptions {
  /** Perfil da CPU (jogador 1). Padrão: comum. */
  cpu?: CpuKind;
  /** Ajuste do orçamento (ferramentas: simulações em vez de ms). */
  budget?: Partial<Pick<CpuProfile, 'maxMs' | 'maxSims'>>;
  /** Quebra-cabeças dos testes: cartas já em jogo, mão inicial e LP. */
  placed?: PlacedCard[];
  startingDraw?: number;
  lp?: [number, number];
}

/**
 * Conduz um duelo: avança o motor, responde pela CPU (jogador 1) e pelos prompts automáticos, e para quando
 * precisa do jogador 0. É o mesmo código no Worker e nos testes em Node.
 */
export class DuelDriver {
  readonly session: DuelSession;
  autoPass = false;
  private narrator: Narrator;
  private lastPrompt: OcgMessage | null = null;
  private cardList: OcgCardData[];
  private mem: [PolicyMemory, PolicyMemory] = [newMemory(), newMemory()];
  private sessionOpts: DuelOptions;
  private decks: [DeckList, DeckList];
  /** De onde a busca tira cópias do duelo (também usada nos testes). */
  readonly fork: ForkSource;
  readonly profile: CpuProfile;
  /**
   * Recebe os steps acumulados antes de cada decisão da CPU (a tela encena enquanto ela pensa); sem ele, tudo vai junto
   * no `prompt`/`end`.
   */
  onProgress: ((steps: Step[]) => void) | null = null;
  /** Última busca (diagnóstico e ferramentas). */
  lastSearch: SearchStats | null = null;
  /** Rastreamento opcional (modo diagnóstico). */
  trace: ((t: string) => void) | null = null;
  /** Últimos tipos de mensagem (para diagnóstico). */
  private trail: string[] = [];

  constructor(core: OcgCoreSync, private cards: Record<string, CardRecord>, script: (name: string) => string | null,
    mine: DeckList, foe: DeckList, seed: number, log?: (t: string) => void, opts: DriverOptions = {}) {
    this.narrator = new Narrator();
    this.cardList = Object.values(cards).map((c) => ({ ...c, race: BigInt(c.race) }) as OcgCardData);
    this.decks = [mine, foe];
    this.sessionOpts = { seed: BigInt(seed), log, placed: opts.placed, startingDraw: opts.startingDraw, lp: opts.lp };
    if (opts.lp) this.narrator.lp = [...opts.lp];
    this.session = startDuel(core, { cards, script }, this.decks, this.sessionOpts);
    this.profile = { ...PROFILES[opts.cpu ?? 'comum'], ...opts.budget };
    const lp0: [number, number] = opts.lp ?? [8000, 8000];
    this.fork = {
      live: this.session, lp0, db: cards, cards: this.cardList,
      fork: (track) => forkDuel(core, { cards, script }, this.decks, { ...this.sessionOpts, log: undefined }, this.session.log, (ms) => track.feed(ms)),
    };
  }

  /** Contexto da política barata para o jogador `p` no duelo de verdade. */
  private ctx(p: number) {
    return { session: this.session, db: this.cards, cards: this.cardList, mem: this.mem[p & 1], turn: this.narrator.turn, peek: false };
  }

  /**
   * A jogada da CPU para um prompt (do jogador 1, ou do 0 nas ferramentas que jogam pelos dois lados): a busca com o
   * perfil dado. O jogador 0, sem perfil, joga sempre como comum.
   */
  think(sel: OcgMessage, profile: CpuProfile = this.profile): OcgResponse | null {
    const p = ('player' in sel ? (sel.player as number) : 1) & 1;
    const { response, stats } = decide(sel, this.fork, profile, this.mem[p], { turn: this.narrator.turn, phase: this.narrator.phase });
    this.lastSearch = stats;
    if (stats.sims) this.trace?.(`CPU ${OcgMessageType[sel.type]}: ${stats.candidates} opções, ${stats.sims} simulações, ${stats.ms} ms`);
    return response;
  }

  /** A política barata (sem simulação), para quem joga pelo jogador 0 nas ferramentas. */
  cheap(sel: OcgMessage): OcgResponse | null {
    const p = ('player' in sel ? (sel.player as number) : 0) & 1;
    return cpuRespond(sel, this.ctx(p));
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
    // Beats desde a última mensagem para a tela. O retrato do tabuleiro vai no último beat de cada passo do motor (a
    // consulta só vê o fim do passo); o primeiro beat depois de uma jogada da CPU leva `think`.
    const steps: Step[] = [];
    let cpuActed = false;
    const push = (batch: Step[]) => {
      for (const st of batch) {
        if (cpuActed && (this.narrator.turnPlayer === 1 || (st.beat.k === 'activate' && st.beat.p === 1))) st.think = true;
        cpuActed = false;
        steps.push(st);
      }
    };
    const t0 = Date.now();
    let thinking = 0;
    for (let n = 0; ; n++) {
      const busy = Date.now() - t0 - thinking;
      if (n >= MAX_STEPS || busy > MAX_MS) return { t: 'error', text: `O motor entrou em laço (${n} passos, ${busy} ms). ${this.diag()}` };
      this.trace?.(`step ${n}…`);
      const { status, messages } = s.step();
      this.trace?.(`step ${n}: status ${status}, ${messages.length} msgs [${messages.slice(-4).map((m) => OcgMessageType[m.type]).join(',')}]`);
      let winner: number | null = null;
      const before = steps.length;
      for (const m of messages) {
        push(this.narrator.feed(m, s));
        if (m.type === OcgMessageType.WIN) winner = m.player;
      }
      push(this.narrator.flush());
      const board = this.narrator.snapshot(s);
      if (steps.length > before) steps[steps.length - 1].board = board;
      if (winner !== null || status === OcgProcessResult.END) return { t: 'end', winner: winner ?? -1, board, steps };
      const sel = [...messages].reverse().find(isSelect);
      if (!sel || !('player' in sel)) {
        // Resposta rejeitada: pede de novo o mesmo comando em vez de travar.
        if (messages.some((m) => m.type === OcgMessageType.RETRY) && this.lastPrompt) {
          this.note('RETRY');
          return { t: 'prompt', msg: this.lastPrompt, board, steps, notice: RETRY_NOTICE };
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
        const auto = cpuRespond(sel, this.ctx(0));
        if (auto) { s.respond(auto); continue; }
      }
      if (sel.player === 0) { this.lastPrompt = sel; return { t: 'prompt', msg: sel, board, steps }; }
      this.onProgress?.(steps.splice(0));
      const t1 = Date.now();
      const r = this.think(sel);
      thinking += Date.now() - t1;
      if (!r) return { t: 'error', text: `CPU sem resposta para ${OcgMessageType[sel.type]}. ${this.diag()}` };
      cpuActed = true;
      s.respond(r);
    }
  }
}
