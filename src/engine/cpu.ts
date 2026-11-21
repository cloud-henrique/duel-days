import {
  cardMatchesOpcode, OcgLocation, OcgMessageType, OcgPosition, OcgResponseType, OcgType, SelectBattleCMDAction, SelectIdleCMDAction,
  type OcgCardData, type OcgCardLoc, type OcgMessage, type OcgResponse, type SelectFieldPlace,
} from 'ocgcore-wasm';
import type { DuelSession } from './session';
import { boardView, EXODIA_PIECES, faceDown, inAttack, isMonster, isResponder, isSpell, isTrap, type BoardView, type SeenCard } from './view';

/** RNG simples e determinístico (mulberry32). */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rng: () => number, xs: T[]) => xs[Math.floor(rng() * xs.length)];

/**
 * Zonas livres a partir da máscara (bit setado = indisponível). Bits 0-15 são do próprio jogador, 16-31 do oponente;
 * em cada metade: 0-6 monstros, 8-12 magias/armadilhas, 13 campo, 14-15 pêndulo. Prefere o próprio campo.
 */
export function freePlaces(mask: number, player: number, count: number) {
  const places: SelectFieldPlace[] = [];
  for (let b = 0; b < 32 && places.length < count; b++) {
    if (mask & (1 << b)) continue;
    const local = b % 16;
    const owner = b < 16 ? player : 1 - player;
    if (local <= 6) places.push({ player: owner, location: OcgLocation.MZONE, sequence: local });
    else if (local >= 8 && local <= 13) places.push({ player: owner, location: OcgLocation.SZONE, sequence: local - 8 });
    else if (local >= 14) places.push({ player: owner, location: OcgLocation.SZONE, sequence: local - 8 });
  }
  return places;
}

const PROMPTS = new Set<number>([
  OcgMessageType.SELECT_BATTLECMD, OcgMessageType.SELECT_IDLECMD, OcgMessageType.SELECT_EFFECTYN, OcgMessageType.SELECT_YESNO,
  OcgMessageType.SELECT_OPTION, OcgMessageType.SELECT_CARD, OcgMessageType.SELECT_CHAIN, OcgMessageType.SELECT_PLACE,
  OcgMessageType.SELECT_POSITION, OcgMessageType.SELECT_TRIBUTE, OcgMessageType.SORT_CHAIN, OcgMessageType.SELECT_COUNTER,
  OcgMessageType.SELECT_SUM, OcgMessageType.SELECT_DISFIELD, OcgMessageType.SORT_CARD, OcgMessageType.SELECT_UNSELECT_CARD,
  OcgMessageType.ROCK_PAPER_SCISSORS, OcgMessageType.ANNOUNCE_RACE, OcgMessageType.ANNOUNCE_ATTRIB, OcgMessageType.ANNOUNCE_CARD,
  OcgMessageType.ANNOUNCE_NUMBER,
]);
/** A mensagem pede uma resposta do jogador? */
/**
 * Outras respostas legais para o mesmo pedido, para quando o motor recusa uma resposta automática (RETRY). Ex.: com
 * "deve atacar este turno" (Amazoness Archers), o comando de batalha ainda oferece ir para a Main 2/End, mas o motor
 * recusa; a saída é atacar. Ordem: o que faz o jogo andar primeiro. Vazio para os pedidos sem alternativa simples.
 */
export function alternatives(m: OcgMessage): OcgResponse[] {
  switch (m.type) {
    case OcgMessageType.SELECT_BATTLECMD: {
      const B = (action: SelectBattleCMDAction, index: number | null): OcgResponse => ({ type: OcgResponseType.SELECT_BATTLECMD, action, index });
      return [
        ...m.attacks.map((_, i) => B(SelectBattleCMDAction.SELECT_BATTLE, i)),
        ...(m.to_m2 ? [B(SelectBattleCMDAction.TO_M2, null)] : []), ...(m.to_ep ? [B(SelectBattleCMDAction.TO_EP, null)] : []),
        ...m.chains.map((_, i) => B(SelectBattleCMDAction.SELECT_CHAIN, i)),
      ];
    }
    case OcgMessageType.SELECT_IDLECMD: {
      const I = (action: SelectIdleCMDAction, index: number | null): OcgResponse => ({ type: OcgResponseType.SELECT_IDLECMD, action, index });
      return [
        ...(m.to_bp ? [I(SelectIdleCMDAction.TO_BP, null)] : []), ...(m.to_ep ? [I(SelectIdleCMDAction.TO_EP, null)] : []),
        ...m.summons.map((_, i) => I(SelectIdleCMDAction.SELECT_SUMMON, i)),
        ...m.monster_sets.map((_, i) => I(SelectIdleCMDAction.SELECT_MONSTER_SET, i)),
        ...m.spell_sets.map((_, i) => I(SelectIdleCMDAction.SELECT_SPELL_SET, i)),
        ...m.activates.map((_, i) => I(SelectIdleCMDAction.SELECT_ACTIVATE, i)),
      ];
    }
    case OcgMessageType.SELECT_CHAIN:
      return [...(m.forced ? [] : [{ type: OcgResponseType.SELECT_CHAIN, index: null } as OcgResponse]),
        ...m.selects.map((_, i) => ({ type: OcgResponseType.SELECT_CHAIN, index: i }) as OcgResponse)];
    case OcgMessageType.SELECT_EFFECTYN:
      return [{ type: OcgResponseType.SELECT_EFFECTYN, yes: false }, { type: OcgResponseType.SELECT_EFFECTYN, yes: true }];
    case OcgMessageType.SELECT_YESNO:
      return [{ type: OcgResponseType.SELECT_YESNO, yes: false }, { type: OcgResponseType.SELECT_YESNO, yes: true }];
    default:
      return [];
  }
}

export function isSelect(m: OcgMessage) {
  return PROMPTS.has(m.type) && 'player' in m;
}

const lowBits = (mask: number | bigint, n: number) => {
  const out: bigint[] = []; let v = BigInt(mask);
  for (let bit = 1n; v >= bit && out.length < n; bit <<= 1n) if (v & bit) out.push(bit);
  return out;
};

/** Dados de carta que a política usa (o `CardRecord` serve). */
export interface CardInfo { type: number; attack: number; defense: number; level: number; desc?: string }

/** O que a política lembra entre prompts do mesmo jogador (o alvo do ataque escolhido, o que já ativou no turno). */
export interface PolicyMemory {
  turn: number;
  /** Carta cujo efeito está pedindo alvos agora (decide o lado do alvo). */
  activating: number | null;
  /** Alvo planejado para o ataque declarado (controlador, zona). */
  attackTarget: { controller: number; sequence: number } | null;
  /** Ativações já feitas neste turno (evita laço com efeitos que o motor oferece de novo). */
  used: string[];
}
export const newMemory = (): PolicyMemory => ({ turn: -1, activating: null, attackTarget: null, used: [] });
export const cloneMemory = (m: PolicyMemory): PolicyMemory => ({ ...m, attackTarget: m.attackTarget && { ...m.attackTarget }, used: [...m.used] });

export interface CpuContext {
  /** Lista de cartas (para anunciar uma carta). */
  cards?: OcgCardData[];
  /** Dados das cartas por código. */
  db?: Record<string, CardInfo>;
  /** Duelo para ler o tabuleiro. Sem ele, a política cai em respostas neutras (os primeiros índices). */
  session?: DuelSession;
  /** Tabuleiro já lido (evita reler). */
  view?: BoardView;
  mem?: PolicyMemory;
  turn?: number;
  /** Pode usar o que o oponente esconde (mão, viradas)? Só o chefe. */
  peek?: boolean;
  /** Na continuação honesta: não ataca monstro virado (o resultado revelaria a carta). */
  blindFacedown?: boolean;
}

/** DEF e valor estimados de um monstro virado que a CPU não pode olhar. */
export const FACEDOWN_DEF = 1500;
const FACEDOWN_VALUE = 1300;
/** Peça do Exodia: vale mais que qualquer carta, para nunca ser o descarte nem o custo. */
const EXODIA_VALUE = 10000;

const keyOf = (c: OcgCardLoc) => `${c.code}@${c.controller}:${c.location}:${c.sequence}`;

/** Força de um monstro visto de um lado: o que a CPU pode saber dele. */
function strength(c: SeenCard, me: number, peek: boolean) {
  if (c.controller !== me && faceDown(c) && !peek) return FACEDOWN_DEF;
  return inAttack(c) ? c.attack : Math.max(c.attack, c.defense);
}
/** Valor de uma carta para escolher alvos e custos. */
export function cardValue(c: SeenCard, me: number, peek: boolean) {
  if (c.controller !== me && faceDown(c) && !peek) return c.location === OcgLocation.MZONE ? FACEDOWN_VALUE : 900;
  if (EXODIA_PIECES.has(c.code)) return EXODIA_VALUE;
  if (isMonster(c.type)) return 300 + Math.max(c.attack, c.defense);
  return isTrap(c.type) ? 900 : 700;
}

/**
 * O efeito da carta favorece quem o usa no alvo (equipar, aumentar)? Pelo texto da carta (em inglês, da base). Sem
 * texto, ou com palavras de dano, é hostil.
 */
export function friendlyEffect(desc: string | undefined) {
  if (!desc) return false;
  const d = desc.toLowerCase();
  const hostile = /destroy|take control|banish|return .* to the hand|send .* to the (graveyard|gy)|lose[s]? \d+|decrease|cannot attack|change .* battle position|to face-down/.test(d);
  const friendly = /equip|gains? \d+|increase|special summon/.test(d);
  return friendly && !hostile;
}

function lookup(ctx: CpuContext, code: number): CardInfo | undefined { return ctx.db?.[String(code)]; }

/** Onde está a carta num `BoardView` (pela zona). */
function seenAt(v: BoardView, c: { controller: number; location: number; sequence: number }): SeenCard | undefined {
  const side = v[c.controller & 1];
  const list = c.location === OcgLocation.MZONE ? side.mzone : c.location === OcgLocation.SZONE ? side.szone
    : c.location === OcgLocation.HAND ? side.hand : [];
  return list.find((x) => x.sequence === c.sequence);
}

/** Uma `SeenCard` para uma carta que não está nas zonas lidas (deck, cemitério, extra): pelos dados da base. */
function asSeen(ctx: CpuContext, c: OcgCardLoc & { position?: number }): SeenCard {
  const v = ctx.view ? seenAt(ctx.view, c) : undefined;
  if (v) return v;
  const d = lookup(ctx, c.code);
  return {
    code: c.code, controller: c.controller, location: c.location, sequence: c.sequence, position: c.position ?? OcgPosition.FACEUP_ATTACK,
    type: d?.type ?? 0, attack: d?.attack ?? 0, defense: d?.defense ?? 0, level: d?.level ?? 0,
  };
}

/** Tributos que um monstro pede pela invocação normal. */
const tributesFor = (level: number) => (level >= 7 ? 2 : level >= 5 ? 1 : 0);

function view(ctx: CpuContext) {
  if (!ctx.view && ctx.session) ctx.view = boardView(ctx.session, ctx.db);
  return ctx.view;
}

/** O melhor alvo que este atacante vence (ou null). Ataque direto: `{ direct: true }`. */
export function bestAttack(atk: number, canDirect: boolean, v: BoardView, me: number, ctx: CpuContext):
  { direct: true } | { target: SeenCard; gain: number } | null {
  const opp = v[1 - me];
  if (canDirect && opp.mzone.length === 0) return { direct: true };
  let best: { target: SeenCard; gain: number } | null = null;
  for (const t of opp.mzone) {
    const hidden = faceDown(t) && !ctx.peek;
    if (hidden && ctx.blindFacedown) continue;
    let gain = -Infinity;
    if (!hidden && inAttack(t)) {
      if (atk > t.attack) gain = cardValue(t, me, true) + (atk - t.attack);
    } else {
      const def = hidden ? FACEDOWN_DEF : t.defense;
      if (atk > def) gain = cardValue(t, me, !!ctx.peek) - (hidden ? 200 : 0);
    }
    if (gain > -Infinity && (!best || gain > best.gain)) best = { target: t, gain };
  }
  if (canDirect) return best && best.gain > atk ? best : { direct: true };
  return best;
}

/** Atualiza a memória com a resposta escolhida (pela política ou pela busca). */
export function noteChoice(m: OcgMessage, r: OcgResponse, ctx: CpuContext) {
  const mem = ctx.mem;
  if (!mem) return;
  if (m.type === OcgMessageType.SELECT_IDLECMD && r.type === OcgResponseType.SELECT_IDLECMD && r.index != null) {
    if (r.action === SelectIdleCMDAction.SELECT_ACTIVATE) {
      const c = m.activates[r.index];
      mem.activating = c.code; mem.used.push(keyOf(c) + ':' + c.description);
    } else mem.activating = null;
  } else if (m.type === OcgMessageType.SELECT_BATTLECMD && r.type === OcgResponseType.SELECT_BATTLECMD) {
    mem.attackTarget = null;
    if (r.action === SelectBattleCMDAction.SELECT_BATTLE && r.index != null) {
      const a = m.attacks[r.index]; const v = view(ctx);
      const atk = v ? (seenAt(v, a)?.attack ?? lookup(ctx, a.code)?.attack ?? 0) : 0;
      const plan = v ? bestAttack(atk, a.can_direct, v, m.player, { ...ctx, blindFacedown: false }) : null;
      if (plan && 'target' in plan) mem.attackTarget = { controller: plan.target.controller, sequence: plan.target.sequence };
    } else if (r.action === SelectBattleCMDAction.SELECT_CHAIN && r.index != null) mem.activating = m.chains[r.index].code;
  } else if (m.type === OcgMessageType.SELECT_CHAIN && r.type === OcgResponseType.SELECT_CHAIN && r.index != null) {
    const c = m.selects[r.index];
    mem.activating = c.code; mem.used.push(keyOf(c) + ':' + c.description);
  } else if ((m.type === OcgMessageType.SELECT_EFFECTYN) && r.type === OcgResponseType.SELECT_EFFECTYN && r.yes) {
    mem.activating = m.code;
  }
}

/**
 * Política barata e determinística da CPU: regras simples, sem simulação. É o prior da busca (`search.ts`), a política
 * das continuações e a dos prompts automáticos do jogador. Sem `session`/`view`, responde de forma neutra.
 */
export function cpuRespond(m: OcgMessage, ctx: CpuContext = {}): OcgResponse | null {
  const r = choose(m, ctx);
  if (r) noteChoice(m, r, ctx);
  return r;
}

function choose(m: OcgMessage, ctx: CpuContext): OcgResponse | null {
  const mem = ctx.mem;
  if (mem && ctx.turn != null && mem.turn !== ctx.turn) { mem.turn = ctx.turn; mem.used = []; mem.attackTarget = null; }
  const me = 'player' in m ? (m.player as number) & 1 : 1;
  const peek = !!ctx.peek;
  switch (m.type) {
    case OcgMessageType.SELECT_IDLECMD: return idle(m, me, ctx);
    case OcgMessageType.SELECT_BATTLECMD: {
      const v = view(ctx);
      let best: { i: number; score: number } | null = null;
      if (v) {
        m.attacks.forEach((a, i) => {
          const atk = seenAt(v, a)?.attack ?? 0;
          const plan = bestAttack(atk, a.can_direct, v, me, ctx);
          if (!plan) return;
          const score = 'direct' in plan ? atk : plan.gain;
          if (!best || score > best.score) best = { i, score };
        });
      } else if (m.attacks.length) best = { i: 0, score: 0 };
      if (best) return { type: OcgResponseType.SELECT_BATTLECMD, action: SelectBattleCMDAction.SELECT_BATTLE, index: (best as { i: number }).i };
      return { type: OcgResponseType.SELECT_BATTLECMD, action: m.to_m2 ? SelectBattleCMDAction.TO_M2 : SelectBattleCMDAction.TO_EP, index: null };
    }
    case OcgMessageType.SELECT_CHAIN: {
      if (m.forced) return { type: OcgResponseType.SELECT_CHAIN, index: 0 };
      if (!view(ctx)) return { type: OcgResponseType.SELECT_CHAIN, index: null };
      // Responde com o que estiver pronto, uma vez por carta no turno.
      const i = m.selects.findIndex((c) => !mem?.used.includes(keyOf(c) + ':' + c.description));
      return { type: OcgResponseType.SELECT_CHAIN, index: i >= 0 && m.selects.length ? i : null };
    }
    case OcgMessageType.SELECT_EFFECTYN:
      return { type: OcgResponseType.SELECT_EFFECTYN, yes: true };
    case OcgMessageType.SELECT_YESNO:
      return { type: OcgResponseType.SELECT_YESNO, yes: true };
    case OcgMessageType.SELECT_OPTION:
      return { type: OcgResponseType.SELECT_OPTION, index: 0 };
    case OcgMessageType.SELECT_CARD: {
      const n = Math.max(m.min, 1);
      if (!view(ctx)) return { type: OcgResponseType.SELECT_CARD, indicies: Array.from({ length: m.min }, (_, i) => i) };
      // Alvo do ataque planejado.
      const at = mem?.attackTarget;
      if (at) {
        const i = m.selects.findIndex((c) => c.controller === at.controller && c.location === OcgLocation.MZONE && c.sequence === at.sequence);
        mem!.attackTarget = null;
        if (i >= 0 && m.min <= 1) return { type: OcgResponseType.SELECT_CARD, indicies: [i] };
      }
      return { type: OcgResponseType.SELECT_CARD, indicies: rankTargets(m.selects, me, ctx).slice(0, Math.min(n, m.selects.length)) };
    }
    case OcgMessageType.SELECT_TRIBUTE: {
      // Os de menor valor primeiro; cada um vale `release_param` tributos (1 ou 2): soma até o mínimo.
      const order = m.selects.map((c, i) => ({ i, v: cardValue(asSeen(ctx, c), me, true) })).sort((a, b) => a.v - b.v);
      const picked: number[] = []; let total = 0;
      for (const { i } of order) { if (total >= m.min) break; picked.push(i); total += m.selects[i].release_param || 1; }
      return { type: OcgResponseType.SELECT_TRIBUTE, indicies: picked };
    }
    case OcgMessageType.SELECT_UNSELECT_CARD: {
      if (!(m.min > 0 || !m.can_finish)) return { type: OcgResponseType.SELECT_UNSELECT_CARD, index: null };
      if (!view(ctx) || !m.select_cards.length) return { type: OcgResponseType.SELECT_UNSELECT_CARD, index: 0 };
      return { type: OcgResponseType.SELECT_UNSELECT_CARD, index: rankTargets(m.select_cards, me, ctx)[0] };
    }
    case OcgMessageType.SELECT_PLACE:
      return { type: OcgResponseType.SELECT_PLACE, places: freePlaces(m.field_mask, m.player, m.count) };
    case OcgMessageType.SELECT_DISFIELD:
      return { type: OcgResponseType.SELECT_DISFIELD, places: freePlaces(m.field_mask, m.player, m.count) };
    case OcgMessageType.SELECT_POSITION: {
      const d = lookup(ctx, m.code); const v = view(ctx);
      const oppBest = v ? Math.max(0, ...v[1 - me].mzone.map((c) => strength(c, me, peek))) : 0;
      const wantAttack = !d || !v || d.attack >= oppBest || d.attack >= d.defense;
      const order = wantAttack
        ? [OcgPosition.FACEUP_ATTACK, OcgPosition.FACEUP_DEFENSE, OcgPosition.FACEDOWN_DEFENSE]
        : [OcgPosition.FACEUP_DEFENSE, OcgPosition.FACEDOWN_DEFENSE, OcgPosition.FACEUP_ATTACK];
      const p = order.find((x) => m.positions & x);
      return { type: OcgResponseType.SELECT_POSITION, position: (p ?? m.positions) as never };
    }
    case OcgMessageType.SELECT_SUM: return selectSum(m);
    case OcgMessageType.SELECT_COUNTER: {
      let left = m.count;
      return { type: OcgResponseType.SELECT_COUNTER, counters: m.cards.map((c) => { const take = Math.min(c.count, left); left -= take; return take; }) };
    }
    case OcgMessageType.ANNOUNCE_ATTRIB:
      return { type: OcgResponseType.ANNOUNCE_ATTRIB, attributes: lowBits(m.available, m.count).map(Number) as never };
    case OcgMessageType.ANNOUNCE_RACE:
      return { type: OcgResponseType.ANNOUNCE_RACE, races: lowBits(m.available, m.count) as never };
    case OcgMessageType.ANNOUNCE_NUMBER:
      return { type: OcgResponseType.ANNOUNCE_NUMBER, value: 0 };
    case OcgMessageType.ANNOUNCE_CARD: {
      const hit = ctx.cards?.find((c) => cardMatchesOpcode(c, m.opcodes));
      return { type: OcgResponseType.ANNOUNCE_CARD, card: hit?.code ?? ctx.cards?.[0]?.code ?? 0 };
    }
    case OcgMessageType.SORT_CARD:
    case OcgMessageType.SORT_CHAIN:
      return { type: OcgResponseType.SORT_CARD, order: null };
    case OcgMessageType.ROCK_PAPER_SCISSORS:
      return { type: OcgResponseType.ROCK_PAPER_SCISSORS, value: 1 };
    default:
      return null;
  }
}

/**
 * Ordena candidatos a alvo/custo, do melhor para o pior, para quem escolhe (`me`):
 * - do próprio deck, cemitério ou extra (buscar, reviver): o de maior valor;
 * - da própria mão (descartar) ou campo com efeito hostil (custo, tributo): o de menor valor;
 * - do próprio campo com efeito favorável (equipar): o de maior valor;
 * - do oponente: hostil, o de maior valor; favorável, o de menor.
 */
export function rankTargets(selects: (OcgCardLoc & { position?: number })[], me: number, ctx: CpuContext): number[] {
  const act = ctx.mem?.activating;
  const friendly = act != null && friendlyEffect(lookup(ctx, act)?.desc);
  const peek = !!ctx.peek;
  const score = (c: OcgCardLoc & { position?: number }) => {
    const s = asSeen(ctx, c);
    const val = cardValue(s, me, peek);
    if (c.controller === me) {
      if (c.location === OcgLocation.DECK || c.location === OcgLocation.GRAVE || c.location === OcgLocation.EXTRA || c.location === OcgLocation.REMOVED) return 10000 + val;
      if (c.location === OcgLocation.HAND) return -val;
      return friendly ? 10000 + val : -val;
    }
    return friendly ? -val - 20000 : 20000 + val;
  };
  return selects.map((c, i) => ({ i, s: score(c) })).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.i);
}

function selectSum(m: Extract<OcgMessage, { type: OcgMessageType.SELECT_SUM }>): OcgResponse {
  // Procura um subconjunto cuja soma (com os obrigatórios) bata exatamente o total; se não houver, vai guloso.
  const base = m.selects_must.reduce((a, c) => a + (c.amount & 0xffff), 0);
  const vals = m.selects.map((c) => c.amount & 0xffff);
  const n = Math.min(vals.length, 14);
  for (let mask = 0; mask < 1 << n; mask++) {
    let sum = base, cnt = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { sum += vals[i]; cnt++; }
    if (sum === m.amount && cnt >= m.min && (m.max === 0 || cnt <= m.max)) return { type: OcgResponseType.SELECT_SUM, indicies: Array.from({ length: n }, (_, i) => i).filter((i) => mask & (1 << i)) };
  }
  // "Igual ou maior" (`select_max`, ex. Ritual com níveis): o menor conjunto que alcança o total sem carta sobrando
  // (tirar qualquer uma deixaria abaixo). O guloso escolheria cartas a mais e o motor recusaria (laço de RETRY).
  if (m.select_max) {
    let best: { mask: number; sum: number; cnt: number } | null = null;
    for (let mask = 1; mask < 1 << n; mask++) {
      let sum = base, cnt = 0, low = Infinity;
      for (let i = 0; i < n; i++) if (mask & (1 << i)) { sum += vals[i]; cnt++; low = Math.min(low, vals[i]); }
      if (sum < m.amount || sum - low >= m.amount || cnt < m.min || (m.max !== 0 && cnt > m.max)) continue;
      if (!best || sum < best.sum || (sum === best.sum && cnt < best.cnt)) best = { mask, sum, cnt };
    }
    if (best) return { type: OcgResponseType.SELECT_SUM, indicies: Array.from({ length: n }, (_, i) => i).filter((i) => best!.mask & (1 << i)) };
  }
  let total = base; const picked: number[] = [];
  for (let i = 0; i < vals.length && (total < m.amount || picked.length < m.min); i++) { picked.push(i); total += vals[i]; }
  return { type: OcgResponseType.SELECT_SUM, indicies: picked };
}

function idle(m: Extract<OcgMessage, { type: OcgMessageType.SELECT_IDLECMD }>, me: number, ctx: CpuContext): OcgResponse {
  const R = (action: SelectIdleCMDAction, index: number | null): OcgResponse => ({ type: OcgResponseType.SELECT_IDLECMD, action, index });
  const pass = () => m.to_bp && (!m.to_ep || hasAttacker) ? R(SelectIdleCMDAction.TO_BP, null)
    : m.to_ep ? R(SelectIdleCMDAction.TO_EP, null) : m.to_bp ? R(SelectIdleCMDAction.TO_BP, null) : R(SelectIdleCMDAction.SHUFFLE, null);
  const v = view(ctx);
  const peek = !!ctx.peek;
  const mine = v?.[me];
  const hasAttacker = !!mine?.mzone.some((c) => inAttack(c) && !faceDown(c) && c.attack > 0);
  if (!v || !mine) {
    // Sem tabuleiro: o primeiro de cada grupo, nunca uma ativação repetida.
    if (m.summons.length) return R(SelectIdleCMDAction.SELECT_SUMMON, 0);
    return pass();
  }
  const oppMons = v[1 - me].mzone;
  const oppBest = Math.max(0, ...oppMons.map((c) => strength(c, me, peek)));
  const info = (c: OcgCardLoc) => asSeen(ctx, c);

  // 1. Invocação-Especial pelo próprio procedimento (ex.: monstros que se invocam): a de maior ATK.
  if (m.special_summons.length) {
    const i = argmax(m.special_summons.map((c) => info(c).attack));
    return R(SelectIdleCMDAction.SELECT_SPECIAL_SUMMON, i);
  }
  // 2. Magias de Campo e de Equipamento, e as Normais (exceto as já usadas e a cópia do Campo ativo).
  const field = mine.szone.find((c) => c.sequence === 5 && !faceDown(c));
  const act = m.activates.findIndex((c) => {
    if (ctx.mem?.used.includes(keyOf(c) + ':' + c.description)) return false;
    const d = info(c);
    if (field && d.code === field.code) return false;
    if (isMonster(d.type) && c.location === OcgLocation.MZONE) return true;
    if (!isSpell(d.type)) return c.location === OcgLocation.SZONE && isTrap(d.type) && !isResponder(d.type);
    // Equipamento só com monstro próprio para receber.
    if ((d.type & OcgType.EQUIP) && !mine.mzone.some((x) => !faceDown(x))) return false;
    return true;
  });
  if (act >= 0) return R(SelectIdleCMDAction.SELECT_ACTIVATE, act);
  // 3. Invocar o mais forte que vence o campo do oponente (ou com o campo dele vazio); senão baixar o de maior DEF.
  const fieldCount = mine.mzone.length;
  const summonable = m.summons.map((c, i) => ({ i, d: info(c) }))
    .filter(({ d }) => tributesFor(d.level) <= fieldCount)
    .filter(({ d }) => {
      const t = tributesFor(d.level);
      if (!t) return true;
      const cheapest = mine.mzone.map((x) => strength(x, me, true)).sort((a, b) => a - b).slice(0, t);
      return d.attack > Math.max(0, ...cheapest) + 300;
    });
  const bestSummon = summonable.sort((a, b) => b.d.attack - a.d.attack)[0];
  if (bestSummon && (bestSummon.d.attack >= oppBest || oppMons.length === 0)) return R(SelectIdleCMDAction.SELECT_SUMMON, bestSummon.i);
  const sets = m.monster_sets.map((c, i) => ({ i, d: info(c) })).filter(({ d }) => tributesFor(d.level) === 0)
    .sort((a, b) => Math.max(b.d.defense, b.d.attack) - Math.max(a.d.defense, a.d.attack));
  if (sets.length) return R(SelectIdleCMDAction.SELECT_MONSTER_SET, sets[0].i);
  if (bestSummon) return R(SelectIdleCMDAction.SELECT_SUMMON, bestSummon.i);
  // 4. Baixar Armadilhas e Rápidas.
  const st = m.spell_sets.findIndex((c) => isResponder(info(c).type));
  if (st >= 0) return R(SelectIdleCMDAction.SELECT_SPELL_SET, st);
  // 5. Monstro em defesa que agora vence: para o ataque (só na fase principal 1).
  if (m.to_bp) {
    const pc = m.pos_changes.findIndex((c) => {
      const s = seenAt(v, c);
      return !!s && !inAttack(s) && !faceDown(s) && s.attack > oppBest && s.attack >= s.defense;
    });
    if (pc >= 0) return R(SelectIdleCMDAction.SELECT_POS_CHANGE, pc);
  }
  return pass();
}

const argmax = (xs: number[]) => xs.reduce((b, x, i) => (x > xs[b] ? i : b), 0);

/**
 * Resposta aleatória (a CPU antiga). Só para os testes de estresse (`smoke`, `monkey`), que querem cobrir o máximo de
 * cartas e caminhos do motor; a CPU do jogo é o `cpuRespond` e a busca.
 */
export function randomRespond(m: OcgMessage, rng: () => number, ctx: { cards?: OcgCardData[] } = {}): OcgResponse | null {
  switch (m.type) {
    case OcgMessageType.SELECT_IDLECMD: {
      const opts: { action: SelectIdleCMDAction; index: number }[] = [];
      m.summons.forEach((_, i) => opts.push({ action: SelectIdleCMDAction.SELECT_SUMMON, index: i }));
      m.special_summons.forEach((_, i) => opts.push({ action: SelectIdleCMDAction.SELECT_SPECIAL_SUMMON, index: i }));
      m.activates.forEach((_, i) => opts.push({ action: SelectIdleCMDAction.SELECT_ACTIVATE, index: i }));
      m.spell_sets.forEach((_, i) => opts.push({ action: SelectIdleCMDAction.SELECT_SPELL_SET, index: i }));
      m.monster_sets.forEach((_, i) => opts.push({ action: SelectIdleCMDAction.SELECT_MONSTER_SET, index: i }));
      if (opts.length && rng() < 0.9) return { type: OcgResponseType.SELECT_IDLECMD, ...pick(rng, opts) };
      // Só responde com o que o motor oferece (to_ep pode ser falso: aí o caminho é pela fase de batalha).
      if (m.to_bp && (!m.to_ep || rng() < 0.7)) return { type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.TO_BP, index: null };
      if (m.to_ep) return { type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.TO_EP, index: null };
      return { type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.SHUFFLE, index: null };
    }
    case OcgMessageType.SELECT_BATTLECMD: {
      if (m.attacks.length) return { type: OcgResponseType.SELECT_BATTLECMD, action: SelectBattleCMDAction.SELECT_BATTLE, index: Math.floor(rng() * m.attacks.length) };
      return { type: OcgResponseType.SELECT_BATTLECMD, action: m.to_ep ? SelectBattleCMDAction.TO_EP : SelectBattleCMDAction.TO_M2, index: null };
    }
    case OcgMessageType.SELECT_CHAIN:
      if (m.forced) return { type: OcgResponseType.SELECT_CHAIN, index: 0 };
      return { type: OcgResponseType.SELECT_CHAIN, index: m.selects.length && rng() < 0.5 ? 0 : null };
    case OcgMessageType.SELECT_EFFECTYN:
    case OcgMessageType.SELECT_YESNO:
      return { type: m.type === OcgMessageType.SELECT_YESNO ? OcgResponseType.SELECT_YESNO : OcgResponseType.SELECT_EFFECTYN, yes: rng() < 0.7 };
    case OcgMessageType.ROCK_PAPER_SCISSORS:
      return { type: OcgResponseType.ROCK_PAPER_SCISSORS, value: (1 + Math.floor(rng() * 3)) as 1 | 2 | 3 };
    default:
      return cpuRespond(m, { cards: ctx.cards });
  }
}
