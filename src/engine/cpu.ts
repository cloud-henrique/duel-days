import {
  cardMatchesOpcode, OcgLocation, OcgMessageType, OcgPosition, OcgResponseType, SelectBattleCMDAction, SelectIdleCMDAction,
  type OcgCardData, type OcgMessage, type OcgResponse, type SelectFieldPlace,
} from 'ocgcore-wasm';

/** RNG simples e determinístico (mulberry32) para a CPU. */
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
export function isSelect(m: OcgMessage) {
  return PROMPTS.has(m.type) && 'player' in m;
}

/** Escolhe uma resposta legal. Preferência: invocar > ativar > baixar > batalhar > encerrar turno. */
export interface CpuContext { cards?: OcgCardData[] }
const lowBits = (mask: number | bigint, n: number) => {
  const out: bigint[] = []; let v = BigInt(mask);
  for (let bit = 1n; v >= bit && out.length < n; bit <<= 1n) if (v & bit) out.push(bit);
  return out;
};

export function cpuRespond(m: OcgMessage, rng: () => number, ctx: CpuContext = {}): OcgResponse | null {
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
    case OcgMessageType.SELECT_OPTION:
      return { type: OcgResponseType.SELECT_OPTION, index: 0 };
    case OcgMessageType.SELECT_CARD:
      return { type: OcgResponseType.SELECT_CARD, indicies: Array.from({ length: m.min }, (_, i) => i) };
    case OcgMessageType.SELECT_TRIBUTE: {
      // Cada carta vale `release_param` tributos (1 ou 2): soma até alcançar o mínimo.
      const picked: number[] = []; let total = 0;
      for (let i = 0; i < m.selects.length && total < m.min; i++) { picked.push(i); total += m.selects[i].release_param || 1; }
      return { type: OcgResponseType.SELECT_TRIBUTE, indicies: picked };
    }
    case OcgMessageType.SELECT_UNSELECT_CARD:
      return { type: OcgResponseType.SELECT_UNSELECT_CARD, index: m.min > 0 || !m.can_finish ? 0 : null };
    case OcgMessageType.SELECT_PLACE:
      return { type: OcgResponseType.SELECT_PLACE, places: freePlaces(m.field_mask, m.player, m.count) };
    case OcgMessageType.SELECT_DISFIELD:
      return { type: OcgResponseType.SELECT_DISFIELD, places: freePlaces(m.field_mask, m.player, m.count) };
    case OcgMessageType.SELECT_POSITION: {
      const p = [OcgPosition.FACEUP_ATTACK, OcgPosition.FACEUP_DEFENSE, OcgPosition.FACEDOWN_DEFENSE].find((x) => m.positions & x);
      return { type: OcgResponseType.SELECT_POSITION, position: (p ?? m.positions) as never };
    }
    case OcgMessageType.SELECT_SUM: {
      // Procura um subconjunto cuja soma (com os obrigatórios) bata exatamente o total; se não houver, vai guloso.
      const base = m.selects_must.reduce((a, c) => a + (c.amount & 0xffff), 0);
      const vals = m.selects.map((c) => c.amount & 0xffff);
      const n = Math.min(vals.length, 14);
      for (let mask = 0; mask < 1 << n; mask++) {
        let sum = base, cnt = 0;
        for (let i = 0; i < n; i++) if (mask & (1 << i)) { sum += vals[i]; cnt++; }
        if (sum === m.amount && cnt >= m.min && (m.max === 0 || cnt <= m.max)) return { type: OcgResponseType.SELECT_SUM, indicies: Array.from({ length: n }, (_, i) => i).filter((i) => mask & (1 << i)) };
      }
      let total = base; const picked: number[] = [];
      for (let i = 0; i < vals.length && (total < m.amount || picked.length < m.min); i++) { picked.push(i); total += vals[i]; }
      return { type: OcgResponseType.SELECT_SUM, indicies: picked };
    }
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
      return { type: OcgResponseType.ROCK_PAPER_SCISSORS, value: (1 + Math.floor(rng() * 3)) as 1 | 2 | 3 };
    default:
      return null;
  }
}
