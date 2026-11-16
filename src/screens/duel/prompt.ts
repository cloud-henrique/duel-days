/** Regras puras da interface do duelo sobre o prompt atual do motor (sem React). */
import {
  OcgMessageType, OcgPhase, OcgResponseType, SelectBattleCMDAction, SelectIdleCMDAction,
  type OcgMessage, type OcgResponse,
} from 'ocgcore-wasm';

export interface CardRef { controller: 0 | 1; location: number; sequence: number }
export interface CardAction { label: string; response: OcgResponse; primary?: boolean }
/** Botão lateral de avanço de fase. `big` é o principal; `small` é o secundário compacto. */
export interface SideAction { label: string; size: 'big' | 'small'; response: OcgResponse }

export const refKey = (r: CardRef) => `${r.controller}:${r.location}:${r.sequence}`;
const same = (a: CardRef, b: CardRef) => a.controller === b.controller && a.location === b.location && a.sequence === b.sequence;

/** Ações que o prompt atual oferece para uma carta específica. */
export function cardActions(m: OcgMessage | null, ref: CardRef): CardAction[] {
  const out: CardAction[] = [];
  if (!m) return out;
  const each = (xs: CardRef[], make: (i: number) => CardAction) => xs.forEach((x, i) => same(x, ref) && out.push(make(i)));
  if (m.type === OcgMessageType.SELECT_IDLECMD) {
    const I = (action: SelectIdleCMDAction, index: number): OcgResponse => ({ type: OcgResponseType.SELECT_IDLECMD, action, index });
    // "Ativar" vem sempre primeiro (como no nativo).
    each(m.activates, (i) => ({ label: 'Ativar', response: I(SelectIdleCMDAction.SELECT_ACTIVATE, i), primary: true }));
    each(m.summons, (i) => ({ label: 'Invocar', response: I(SelectIdleCMDAction.SELECT_SUMMON, i), primary: true }));
    each(m.special_summons, (i) => ({ label: 'Invocar por efeito', response: I(SelectIdleCMDAction.SELECT_SPECIAL_SUMMON, i) }));
    each(m.monster_sets, (i) => ({ label: 'Baixar', response: I(SelectIdleCMDAction.SELECT_MONSTER_SET, i) }));
    each(m.spell_sets, (i) => ({ label: 'Baixar', response: I(SelectIdleCMDAction.SELECT_SPELL_SET, i) }));
    each(m.pos_changes, (i) => ({ label: 'Mudar posição', response: I(SelectIdleCMDAction.SELECT_POS_CHANGE, i) }));
  } else if (m.type === OcgMessageType.SELECT_BATTLECMD) {
    const B = (action: SelectBattleCMDAction, index: number): OcgResponse => ({ type: OcgResponseType.SELECT_BATTLECMD, action, index });
    each(m.chains, (i) => ({ label: 'Ativar', response: B(SelectBattleCMDAction.SELECT_CHAIN, i) }));
    each(m.attacks, (i) => ({ label: m.attacks[i].can_direct ? 'Ataque direto' : 'Atacar', response: B(SelectBattleCMDAction.SELECT_BATTLE, i), primary: true }));
  } else if (m.type === OcgMessageType.SELECT_CHAIN) {
    each(m.selects, (i) => ({ label: 'Ativar', response: { type: OcgResponseType.SELECT_CHAIN, index: i }, primary: true }));
  }
  return out;
}

/** Chaves (`refKey`) das cartas que têm alguma ação no prompt atual. */
export function highlighted(m: OcgMessage | null): Set<string> {
  const set = new Set<string>();
  const add = (xs: CardRef[]) => xs.forEach((x) => set.add(refKey(x)));
  if (m?.type === OcgMessageType.SELECT_IDLECMD) [m.summons, m.special_summons, m.monster_sets, m.spell_sets, m.pos_changes, m.activates].forEach(add);
  else if (m?.type === OcgMessageType.SELECT_BATTLECMD) { add(m.attacks); add(m.chains); }
  else if (m?.type === OcgMessageType.SELECT_CHAIN) add(m.selects);
  return set;
}

/**
 * O botão lateral de avanço de fase para o prompt atual (vazio se o prompt não é de fase). Um botão só, para a fase
 * seguinte: M1 → BATALHA → MAIN 2 → FIM DO TURNO, sem atalho que pule uma fase (pedido do usuário, 16/11/2026).
 */
export function sideActions(m: OcgMessage | null): SideAction[] {
  if (m?.type === OcgMessageType.SELECT_IDLECMD) {
    const idle = (action: SelectIdleCMDAction): OcgResponse => ({ type: OcgResponseType.SELECT_IDLECMD, action, index: null });
    if (m.to_bp) return [{ label: 'BATALHA', size: 'big', response: idle(SelectIdleCMDAction.TO_BP) }];
    if (m.to_ep) return [{ label: 'FIM DO TURNO', size: 'big', response: idle(SelectIdleCMDAction.TO_EP) }];
    return [];
  }
  if (m?.type === OcgMessageType.SELECT_BATTLECMD) {
    const bat = (action: SelectBattleCMDAction): OcgResponse => ({ type: OcgResponseType.SELECT_BATTLECMD, action, index: null });
    if (m.to_m2) return [{ label: 'MAIN 2', size: 'big', response: bat(SelectBattleCMDAction.TO_M2) }];
    if (m.to_ep) return [{ label: 'FIM DO TURNO', size: 'big', response: bat(SelectBattleCMDAction.TO_EP) }];
    return [];
  }
  return [];
}

/** Fases mostradas na barra, com as máscaras do motor (a Battle Phase agrupa seus sub-passos). */
const BATTLE_PHASE = OcgPhase.BATTLE_START | OcgPhase.BATTLE_STEP | OcgPhase.DAMAGE | OcgPhase.DAMAGE_CAL | OcgPhase.BATTLE;
const PHASES: [string, number][] = [
  ['DP', OcgPhase.DRAW], ['SP', OcgPhase.STANDBY], ['M1', OcgPhase.MAIN1], ['BP', BATTLE_PHASE], ['M2', OcgPhase.MAIN2], ['EP', OcgPhase.END],
];

/** Chips da barra de fases, com a fase atual marcada. */
export const phaseChips = (phase: number) => PHASES.map(([label, mask]) => ({ label, on: (phase & mask) !== 0 }));
