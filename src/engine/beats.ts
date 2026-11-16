/**
 * Tradução pura das mensagens do motor em beats (acontecimentos visíveis) e do beat em texto do narrador. Não conhece
 * WASM: a única consulta ao motor (o código da carta numa zona, para o ataque e o equipamento) vem injetada no contexto.
 */
import { OcgLocation, OcgMessageType, OcgPosition, type OcgLocPos, type OcgMessage, type OcgMessageMove } from 'ocgcore-wasm';
import type { Beat, Loc, MoveWhy, Side, Step, Zone } from './protocol';

/** Bits de `reason` do core (`constant.lua`) que mudam a animação. */
export const REASON_DESTROY = 0x1;

const ZONES: Partial<Record<number, Zone>> = {
  [OcgLocation.DECK]: 'deck', [OcgLocation.HAND]: 'hand', [OcgLocation.MZONE]: 'mzone', [OcgLocation.SZONE]: 'szone',
  [OcgLocation.GRAVE]: 'grave', [OcgLocation.REMOVED]: 'removed', [OcgLocation.EXTRA]: 'extra',
};
const zoneOf = (location: number): Zone => ZONES[location] ?? 'none';
const side = (p: number) => (p === 1 ? 1 : 0) as Side;
export const toLoc = (l: { controller: number; location: number; sequence: number }): Loc => ({ p: side(l.controller), zone: zoneOf(l.location), seq: l.sequence });
const onField = (z: Zone) => z === 'mzone' || z === 'szone';
const sameLoc = (a: Loc, b: Loc) => a.p === b.p && a.zone === b.zone && a.seq === b.seq;

/** Motivo de um movimento que não é compra, invocação nem baixa, pelo destino e pelo `reason` do core (`design.md`, item 2). */
export function classifyMove(to: Zone, reason: number): MoveWhy {
  switch (to) {
    case 'grave': return reason & REASON_DESTROY ? 'destroy' : 'grave';
    case 'removed': return 'banish';
    case 'hand': return 'hand';
    case 'deck': case 'extra': return 'deck';
    default: return 'other';
  }
}

/** Estado da tradução entre mensagens (o `Narrator` guarda um por duelo). */
export interface BeatCtx {
  /** Código da carta numa zona (o ataque e o equipamento só trazem a posição). */
  codeAt: (l: OcgLocPos) => number;
  turn: number;
  /** Tamanho da corrente em montagem/resolução. */
  chain: number;
  /** Movimento para o campo à espera da mensagem que diz o que ele é (invocação, baixa). */
  pending: OcgMessageMove | null;
  /** O último beat emitido foi um `move` vindo de uma mensagem logo antes (para tocar juntos). */
  lastMove: boolean;
}
export const newBeatCtx = (codeAt: BeatCtx['codeAt']): BeatCtx => ({ codeAt, turn: 0, chain: 0, pending: null, lastMove: false });

const moveBeat = (m: OcgMessageMove): Beat => {
  const from = toLoc(m.from), to = toLoc(m.to);
  return { k: 'move', from, to, code: m.card, why: classifyMove(to.zone, m.reason ?? 0) };
};

/** Solta o movimento pendente como um `move` comum (nenhuma invocação/baixa o reclamou). */
export function flushBeats(ctx: BeatCtx): Step[] {
  if (!ctx.pending) return [];
  const step: Step = { beat: moveBeat(ctx.pending), ...(ctx.lastMove ? { together: true } : {}) };
  ctx.pending = null;
  ctx.lastMove = true;
  return [step];
}

/**
 * Beats de uma mensagem. Movimentos para o campo esperam a mensagem seguinte: `MOVE` + `SUMMONING`/`SET` viram um beat só,
 * com a origem do movimento. Movimentos consecutivos saem marcados para tocar juntos.
 */
export function toBeats(m: OcgMessage, ctx: BeatCtx): Step[] {
  const T = OcgMessageType;
  // Invocação e baixa reclamam o movimento pendente que chegou no mesmo lugar.
  if (m.type === T.SUMMONING || m.type === T.SPSUMMONING || m.type === T.SET) {
    const to = toLoc(m);
    const pend = ctx.pending && sameLoc(toLoc(ctx.pending.to), to) ? ctx.pending : null;
    const out = pend ? [] : flushBeats(ctx);
    ctx.pending = null;
    ctx.lastMove = false;
    const from = pend ? toLoc(pend.from) : to;
    if (m.type === T.SET) return [...out, { beat: { k: 'set', from, to } }];
    return [...out, { beat: { k: 'summon', from, to, code: m.code, how: m.type === T.SUMMONING ? 'normal' : 'special' } }];
  }
  if (m.type === T.MOVE) {
    const out = flushBeats(ctx);
    const together = ctx.lastMove;
    const to = zoneOf(m.to.location);
    if (onField(to) && !onField(zoneOf(m.from.location))) { ctx.pending = m; return out; }
    ctx.lastMove = true;
    return [...out, { beat: moveBeat(m), ...(together ? { together: true } : {}) }];
  }
  // Dicas não são acontecimentos: não quebram a sequência de movimentos nem soltam o pendente.
  if (m.type === T.HINT || m.type === T.CARD_HINT) return [];
  const out = flushBeats(ctx);
  ctx.lastMove = false;
  const one = (beat: Beat): Step[] => [...out, { beat }];
  switch (m.type) {
    case T.NEW_TURN: ctx.turn++; return one({ k: 'turn', p: side(m.player), n: ctx.turn });
    case T.NEW_PHASE: return one({ k: 'phase', phase: m.phase });
    case T.DRAW: return one({ k: 'draw', p: side(m.player), codes: m.drawn.map((d) => d.code) });
    case T.FLIPSUMMONING: { const at = toLoc(m); return one({ k: 'summon', from: at, to: at, code: m.code, how: 'flip' }); }
    case T.POS_CHANGE: {
      const reveal = (m.prev_position & OcgPosition.FACEDOWN) !== 0 && (m.position & OcgPosition.FACEUP) !== 0;
      return one({ k: 'pos', at: toLoc(m), code: m.code, reveal, defense: (m.position & (OcgPosition.FACEUP_DEFENSE | OcgPosition.FACEDOWN_DEFENSE)) !== 0 });
    }
    case T.CHAINING: ctx.chain = m.chain_size; return one({ k: 'activate', at: toLoc(m), code: m.code, p: side(m.controller) });
    case T.CHAIN_SOLVING: return one({ k: 'chainSolve', link: m.chain_size, of: ctx.chain, result: 'ok' });
    case T.CHAIN_NEGATED: return one({ k: 'chainSolve', link: m.chain_size, of: ctx.chain, result: 'negated' });
    case T.CHAIN_DISABLED: return one({ k: 'chainSolve', link: m.chain_size, of: ctx.chain, result: 'disabled' });
    case T.CHAIN_END: ctx.chain = 0; return out;
    case T.ATTACK: return one({ k: 'attack', from: toLoc(m.card), to: m.target ? toLoc(m.target) : null, code: ctx.codeAt(m.card) });
    case T.DAMAGE: return one({ k: 'lp', p: side(m.player), delta: -m.amount, why: 'damage' });
    case T.RECOVER: return one({ k: 'lp', p: side(m.player), delta: m.amount, why: 'recover' });
    case T.PAY_LPCOST: return one({ k: 'lp', p: side(m.player), delta: -m.amount, why: 'cost' });
    case T.EQUIP: { const at = toLoc(m.card); return one({ k: 'equip', from: at, to: at, target: toLoc(m.target), code: ctx.codeAt(m.card) }); }
    case T.TOSS_COIN: return one({ k: 'toss', what: 'coin', p: side(m.player), results: m.results.map((r) => (r ? 1 : 0)) });
    case T.TOSS_DICE: return one({ k: 'toss', what: 'dice', p: side(m.player), results: [...m.results] });
    case T.WIN: return one({ k: 'win', p: m.player });
    default: return out;
  }
}

const who = (p: number) => (p === 0 ? 'Você' : 'Oponente');

/** Texto do narrador e do histórico para um beat (vazio: o beat não é narrado). */
export function beatText(b: Beat, name: (code: number) => string): string[] {
  switch (b.k) {
    case 'turn': return [`— Turno ${b.n} (${who(b.p)}) —`];
    case 'draw': return b.p === 0 ? b.codes.map((c) => `Você comprou ${name(c)}`) : ['Oponente comprou uma carta'];
    case 'summon': return b.how === 'flip' ? [] : [`${who(b.to.p)} invocou ${name(b.code)}`];
    case 'set': return [`${who(b.to.p)} baixou uma carta`];
    case 'attack': return [`${who(b.from.p)} ataca com ${name(b.code)}`];
    case 'activate': return [`${who(b.p)} ativou ${name(b.code)}`];
    case 'lp': {
      const n = Math.abs(b.delta);
      return [b.why === 'damage' ? `${who(b.p)} perdeu ${n} LP` : b.why === 'recover' ? `${who(b.p)} recuperou ${n} LP` : `${who(b.p)} pagou ${n} LP`];
    }
    case 'win': return [b.p === 0 ? 'Você venceu!' : 'O oponente venceu.'];
    default: return [];
  }
}
