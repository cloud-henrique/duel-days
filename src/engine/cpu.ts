import {
  OcgLocation, OcgMessageType, OcgPosition, OcgResponseType, SelectBattleCMDAction, SelectIdleCMDAction,
  type OcgMessage, type OcgResponse, type SelectFieldPlace,
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

/** Zonas livres a partir da máscara (bit setado = ocupado). Bits 0-15 do próprio jogador. */
export function freePlaces(mask: number, player: number, count: number) {
  const places: SelectFieldPlace[] = [];
  for (let seq = 0; seq < 5 && places.length < count; seq++)
    if (!(mask & (1 << seq))) places.push({ player, location: OcgLocation.MZONE, sequence: seq });
  for (let seq = 0; seq < 5 && places.length < count; seq++)
    if (!(mask & (1 << (8 + seq)))) places.push({ player, location: OcgLocation.SZONE, sequence: seq });
  return places;
}

export function isSelect(m: OcgMessage) {
  return m.type >= OcgMessageType.SELECT_BATTLECMD && m.type <= OcgMessageType.ROCK_PAPER_SCISSORS && 'player' in m;
}

/** Escolhe uma resposta legal. Preferência: invocar > ativar > baixar > batalhar > encerrar turno. */
export function cpuRespond(m: OcgMessage, rng: () => number): OcgResponse | null {
  switch (m.type) {
    case OcgMessageType.SELECT_IDLECMD: {
      const opts: { action: SelectIdleCMDAction; index: number }[] = [];
      m.summons.forEach((_, i) => opts.push({ action: SelectIdleCMDAction.SELECT_SUMMON, index: i }));
      m.special_summons.forEach((_, i) => opts.push({ action: SelectIdleCMDAction.SELECT_SPECIAL_SUMMON, index: i }));
      m.activates.forEach((_, i) => opts.push({ action: SelectIdleCMDAction.SELECT_ACTIVATE, index: i }));
      m.spell_sets.forEach((_, i) => opts.push({ action: SelectIdleCMDAction.SELECT_SPELL_SET, index: i }));
      m.monster_sets.forEach((_, i) => opts.push({ action: SelectIdleCMDAction.SELECT_MONSTER_SET, index: i }));
      if (opts.length && rng() < 0.9) return { type: OcgResponseType.SELECT_IDLECMD, ...pick(rng, opts) };
      if (m.to_bp && rng() < 0.7) return { type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.TO_BP, index: null };
      return { type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.TO_EP, index: null };
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
    case OcgMessageType.SELECT_TRIBUTE:
      return { type: OcgResponseType.SELECT_TRIBUTE, indicies: Array.from({ length: m.min }, (_, i) => i) };
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
    case OcgMessageType.SELECT_SUM:
      return { type: OcgResponseType.SELECT_SUM, indicies: Array.from({ length: m.selects.length }, (_, i) => i).slice(0, Math.max(m.min, 1)) };
    default:
      return null;
  }
}
