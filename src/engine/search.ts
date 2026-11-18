import {
  OcgLocation, OcgMessageType, OcgPhase, OcgPosition, OcgProcessResult, OcgResponseType, SelectBattleCMDAction, SelectIdleCMDAction,
  type OcgCardData, type OcgMessage, type OcgResponse,
} from 'ocgcore-wasm';
import { bestAttack, cloneMemory, cpuRespond, FACEDOWN_DEF, isSelect, noteChoice, rankTargets, type CardInfo, type CpuContext, type PolicyMemory } from './cpu';
import { attackRisk, EVAL, evaluate } from './evaluate';
import type { DuelSession } from './session';
import { DuelTrack } from './track';
import { boardView, faceDown, type BoardView } from './view';

export type CpuKind = 'comum' | 'chefe';
export interface CpuProfile {
  kind: CpuKind;
  /** Pode usar o que o jogador esconde (mão e viradas). */
  peek: boolean;
  /** Teto de tempo por decisão (ms) e de simulações (cópias do duelo). O que vier primeiro. */
  maxMs: number;
  maxSims: number;
}
/** Perfis do jogo. No iPhone o teto em ms é o que limita; nas ferramentas, o número de simulações. */
export const PROFILES: Record<CpuKind, CpuProfile> = {
  comum: { kind: 'comum', peek: false, maxMs: 1000, maxSims: 48 },
  chefe: { kind: 'chefe', peek: true, maxMs: 2000, maxSims: 96 },
};

/** De onde a busca tira cópias do duelo atual. */
export interface ForkSource {
  /** O duelo de verdade (só leitura: tabuleiro para o prior). */
  live: DuelSession;
  /** Uma cópia parada logo antes do prompt atual; as mensagens da reprodução alimentam o `track`. */
  fork(track: DuelTrack): DuelSession;
  /** LP inicial dos dois lados (o ponto de partida do `track`). */
  lp0: [number, number];
  db?: Record<string, CardInfo>;
  cards?: OcgCardData[];
}

export interface SearchStats { candidates: number; sims: number; ms: number; best: number | null }

/** Ganho mínimo sobre "não fazer nada" para a CPU agir (empates ficam com passar: sem jogadas inúteis). */
const EPS = 40;
/** Limite de respostas numa continuação (segurança contra laços). */
const ROLLOUT_MAX = 400;

const isBattlePhase = (phase: number) => phase >= OcgPhase.BATTLE_START && phase <= OcgPhase.BATTLE;

interface Cand { r: OcgResponse; pass?: boolean; /** Nota fixa somada à de passar (ataque contra virado, honesto). */ delta?: number }

/**
 * Decide a resposta de `m` para o jogador do prompt: candidatas legais, cada uma simulada numa cópia até o horizonte
 * (fim do turno, ou a próxima jogada livre do oponente) com a política barata, e avaliada. Sem orçamento, fica com o
 * prior (a política barata).
 */
export function decide(m: OcgMessage, src: ForkSource, profile: CpuProfile, mem: PolicyMemory, live: { turn: number; phase: number },
  now: () => number = Date.now): { response: OcgResponse | null; stats: SearchStats } {
  const t0 = now();
  const me = ('player' in m ? (m.player as number) : 1) & 1;
  const peek = profile.peek;
  const baseCtx = (): CpuContext => ({ session: src.live, db: src.db, cards: src.cards, mem: cloneMemory(mem), turn: live.turn, peek });
  const prior = cpuRespond(m, baseCtx());
  const before = boardView(src.live, src.db);
  const cands = candidates(m, prior, before, me, peek, live, src.db);
  const stats: SearchStats = { candidates: cands.length, sims: 0, ms: 0, best: null };
  const finish = (r: OcgResponse | null) => {
    stats.ms = now() - t0;
    const ctx = baseCtx(); ctx.mem = mem;
    if (r) noteChoice(m, r, ctx);
    return { response: r, stats };
  };
  if (cands.length <= 1 || profile.maxSims <= 0) return finish(prior);

  const scored: { c: Cand; score: number }[] = [];
  let passScore: number | null = null;
  const statics: Cand[] = [];
  for (const c of cands) {
    if (c.delta != null) { statics.push(c); continue; }
    if (stats.sims >= profile.maxSims || now() - t0 >= profile.maxMs) break;
    stats.sims++;
    const score = simulate(m, c.r, src, profile, mem, me, before);
    if (score == null) continue;
    scored.push({ c, score });
    if (c.pass && (passScore == null || score > passScore)) passScore = score;
  }
  if (passScore != null) for (const c of statics) scored.push({ c, score: passScore + c.delta! });
  if (!scored.length) return finish(prior);

  let best = scored[0];
  for (const s of scored) if (s.score > best.score) best = s;
  // Passar ganha os empates: a CPU só age quando a jogada melhora o duelo.
  if (passScore != null && !best.c.pass && best.score <= passScore + EPS) best = scored.find((s) => s.c.pass && s.score === passScore)!;
  stats.best = best.score;
  return finish(best.c.r);
}

/** Simula uma candidata numa cópia e devolve a nota (ou null se a resposta não vale nessa cópia). */
function simulate(m: OcgMessage, r: OcgResponse, src: ForkSource, profile: CpuProfile, mem: PolicyMemory, me: number, before: BoardView): number | null {
  const track = new DuelTrack(src.lp0);
  const s = src.fork(track);
  try {
    const first = s.step();
    track.feed(first.messages);
    const sel = [...first.messages].reverse().find(isSelect);
    if (!sel || sel.type !== m.type) return null;
    const turn0 = track.turn;
    track.attacks = [];
    const peek = profile.peek;
    const myMem = cloneMemory(mem);
    const oppMem = cloneMemory(mem);
    const ctxFor = (session: DuelSession, p: number): CpuContext => p === me
      ? { session, db: src.db, cards: src.cards, mem: myMem, turn: track.turn, peek, blindFacedown: !peek }
      : { session, db: src.db, cards: src.cards, mem: oppMem, turn: track.turn, peek: true };
    noteChoice(m, r, ctxFor(s, me));
    s.respond(r);
    for (let n = 0; n < ROLLOUT_MAX; n++) {
      const { status, messages } = s.step();
      track.feed(messages);
      if (messages.some((x) => x.type === OcgMessageType.RETRY)) return n === 0 ? null : evaluateEnd(s, track, me, peek, before, src.db);
      if (status === OcgProcessResult.END || track.winner != null) break;
      if (track.turn !== turn0) break;
      const next = [...messages].reverse().find(isSelect);
      if (!next || !('player' in next)) break;
      const p = (next.player as number) & 1;
      if (p !== me && (next.type === OcgMessageType.SELECT_IDLECMD || next.type === OcgMessageType.SELECT_BATTLECMD)) break;
      const resp = p === me ? cpuRespond(next, ctxFor(s, p)) : peek ? cpuRespond(next, ctxFor(s, p)) : honestOpponent(next);
      if (!resp) break;
      s.respond(resp);
    }
    return evaluateEnd(s, track, me, peek, before, src.db);
  } finally {
    s.destroy();
  }
}

function evaluateEnd(s: DuelSession, track: DuelTrack, me: number, peek: boolean, before: BoardView, db?: Record<string, CardInfo>) {
  const score = evaluate(boardView(s, db), track, me, peek);
  return peek ? score : score - attackRisk(before, track.attacks, me);
}

/**
 * Como o jogador "responde" nas continuações dos comuns: nunca ativa nada (as viradas dele não disparam e não se
 * revelam) e, no que é obrigatório, dá a resposta neutra (os primeiros índices), sem olhar o que esconde.
 */
export function honestOpponent(m: OcgMessage): OcgResponse | null {
  switch (m.type) {
    case OcgMessageType.SELECT_CHAIN: return { type: OcgResponseType.SELECT_CHAIN, index: m.forced ? 0 : null };
    case OcgMessageType.SELECT_EFFECTYN: return { type: OcgResponseType.SELECT_EFFECTYN, yes: false };
    case OcgMessageType.SELECT_YESNO: return { type: OcgResponseType.SELECT_YESNO, yes: false };
    default: return cpuRespond(m, {});
  }
}

const same = (a: OcgResponse, b: OcgResponse) => JSON.stringify(a, (_, v) => (typeof v === 'bigint' ? String(v) : v)) === JSON.stringify(b, (_, v) => (typeof v === 'bigint' ? String(v) : v));

/** As candidatas de um prompt, o prior primeiro. Prompts sem escolha real devolvem só o prior. */
function candidates(m: OcgMessage, prior: OcgResponse | null, v: BoardView, me: number, peek: boolean,
  live: { phase: number }, db?: Record<string, CardInfo>): Cand[] {
  const out: Cand[] = [];
  const add = (c: Cand) => { if (!out.some((x) => same(x.r, c.r))) out.push(c); };
  const passIdle = (a: SelectIdleCMDAction) => a === SelectIdleCMDAction.TO_BP || a === SelectIdleCMDAction.TO_EP;
  if (prior) {
    const pass = (prior.type === OcgResponseType.SELECT_IDLECMD && passIdle(prior.action))
      || (prior.type === OcgResponseType.SELECT_BATTLECMD && (prior.action === SelectBattleCMDAction.TO_EP || prior.action === SelectBattleCMDAction.TO_M2))
      || (prior.type === OcgResponseType.SELECT_CHAIN && prior.index == null);
    add({ r: prior, pass });
  }
  switch (m.type) {
    case OcgMessageType.SELECT_IDLECMD: {
      const I = (action: SelectIdleCMDAction, index: number | null): Cand => ({ r: { type: OcgResponseType.SELECT_IDLECMD, action, index }, pass: passIdle(action) });
      if (m.to_bp) add(I(SelectIdleCMDAction.TO_BP, null));
      if (m.to_ep) add(I(SelectIdleCMDAction.TO_EP, null));
      m.summons.forEach((_, i) => add(I(SelectIdleCMDAction.SELECT_SUMMON, i)));
      m.special_summons.forEach((_, i) => add(I(SelectIdleCMDAction.SELECT_SPECIAL_SUMMON, i)));
      m.activates.forEach((_, i) => add(I(SelectIdleCMDAction.SELECT_ACTIVATE, i)));
      m.monster_sets.forEach((_, i) => add(I(SelectIdleCMDAction.SELECT_MONSTER_SET, i)));
      m.spell_sets.forEach((_, i) => add(I(SelectIdleCMDAction.SELECT_SPELL_SET, i)));
      m.pos_changes.forEach((_, i) => add(I(SelectIdleCMDAction.SELECT_POS_CHANGE, i)));
      break;
    }
    case OcgMessageType.SELECT_BATTLECMD: {
      const B = (action: SelectBattleCMDAction, index: number | null): OcgResponse => ({ type: OcgResponseType.SELECT_BATTLECMD, action, index });
      if (m.to_m2) add({ r: B(SelectBattleCMDAction.TO_M2, null), pass: true });
      if (m.to_ep) add({ r: B(SelectBattleCMDAction.TO_EP, null), pass: true });
      m.attacks.forEach((a, i) => {
        const r = B(SelectBattleCMDAction.SELECT_BATTLE, i);
        if (!peek) {
          // Honesto: atacar um virado revelaria a carta na simulação. Sem alvo visível que vença, a nota é estimada.
          const atk = v[me].mzone.find((x) => x.sequence === a.sequence)?.attack ?? db?.[String(a.code)]?.attack ?? 0;
          const visible = bestAttack(atk, a.can_direct, v, me, { peek: false, blindFacedown: true });
          const hidden = v[1 - me].mzone.some((x) => faceDown(x));
          if (!visible && hidden) {
            const delta = atk > FACEDOWN_DEF ? EVAL.hiddenMonster : -(FACEDOWN_DEF - atk);
            const i0 = out.findIndex((x) => same(x.r, r));
            if (i0 >= 0) out.splice(i0, 1);
            add({ r, delta: delta - 150 });
            return;
          }
        }
        add({ r });
      });
      m.chains.forEach((_, i) => add({ r: B(SelectBattleCMDAction.SELECT_CHAIN, i) }));
      break;
    }
    case OcgMessageType.SELECT_CHAIN:
      if (m.forced) return out.slice(0, 1);
      add({ r: { type: OcgResponseType.SELECT_CHAIN, index: null }, pass: true });
      m.selects.forEach((_, i) => add({ r: { type: OcgResponseType.SELECT_CHAIN, index: i } }));
      break;
    case OcgMessageType.SELECT_EFFECTYN:
      add({ r: { type: OcgResponseType.SELECT_EFFECTYN, yes: true } });
      add({ r: { type: OcgResponseType.SELECT_EFFECTYN, yes: false } });
      break;
    case OcgMessageType.SELECT_YESNO:
      add({ r: { type: OcgResponseType.SELECT_YESNO, yes: true } });
      add({ r: { type: OcgResponseType.SELECT_YESNO, yes: false } });
      break;
    case OcgMessageType.SELECT_OPTION:
      m.options.forEach((_, i) => add({ r: { type: OcgResponseType.SELECT_OPTION, index: i } }));
      break;
    case OcgMessageType.SELECT_CARD: {
      if (!(m.min <= 1 && m.max === 1)) break;
      // Honesto, na batalha, com monstro virado do oponente entre as opções: é a escolha do alvo do ataque; a batalha
      // revelaria a carta. Fica com o prior (conta de batalha com a DEF estimada).
      const hiddenTarget = m.selects.some((c) => c.controller !== me && c.location === OcgLocation.MZONE && (c.position & OcgPosition.FACEDOWN));
      if (!peek && hiddenTarget && isBattlePhase(live.phase)) break;
      const order = rankTargets(m.selects, me, { view: v, db, peek });
      for (const i of order.slice(0, 12)) add({ r: { type: OcgResponseType.SELECT_CARD, indicies: [i] } });
      break;
    }
    case OcgMessageType.SELECT_POSITION:
      for (const p of [OcgPosition.FACEUP_ATTACK, OcgPosition.FACEUP_DEFENSE, OcgPosition.FACEDOWN_DEFENSE])
        if (m.positions & p) add({ r: { type: OcgResponseType.SELECT_POSITION, position: p as never } });
      break;
    case OcgMessageType.SELECT_TRIBUTE: {
      const n = Math.min(m.selects.length, 6);
      for (let a = 0; a < n; a++) {
        const pa = m.selects[a].release_param || 1;
        if (pa >= m.min) add({ r: { type: OcgResponseType.SELECT_TRIBUTE, indicies: [a] } });
        else for (let b = a + 1; b < n; b++)
          if (pa + (m.selects[b].release_param || 1) >= m.min) add({ r: { type: OcgResponseType.SELECT_TRIBUTE, indicies: [a, b] } });
      }
      break;
    }
    default: break;
  }
  return out.slice(0, 24);
}
