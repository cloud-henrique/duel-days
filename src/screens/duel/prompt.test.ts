import { describe, expect, it } from 'vitest';
import { OcgLocation, OcgResponseType, SelectBattleCMDAction, SelectIdleCMDAction, type OcgMessage } from 'ocgcore-wasm';
import fixtures from './__fixtures__/prompts.json';
import { cardActions, highlighted, phaseChips, refKey, sideActions, type CardRef } from './prompt';

// Prompts reais capturados por proto/capture-fixtures.ts.
const msg = (name: keyof typeof fixtures) => fixtures[name].msg as unknown as OcgMessage;
const hand = (sequence: number): CardRef => ({ controller: 0, location: OcgLocation.HAND, sequence });
const mzone = (sequence: number): CardRef => ({ controller: 0, location: OcgLocation.MZONE, sequence });
const szone = (sequence: number): CardRef => ({ controller: 0, location: OcgLocation.SZONE, sequence });
const labels = (m: OcgMessage, r: CardRef) => cardActions(m, r).map((a) => a.label);

describe('cardActions', () => {
  it('sem prompt não há ações', () => {
    expect(cardActions(null, hand(0))).toEqual([]);
  });

  it('Main Phase: monstro que pode ser invocado ou baixado', () => {
    const acts = cardActions(msg('idle_bp_ep'), hand(1));
    expect(acts.map((a) => a.label)).toEqual(['Invocar', 'Baixar']);
    expect(acts[0]).toMatchObject({ primary: true, response: { type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.SELECT_SUMMON, index: 0 } });
    expect(acts[1].response).toEqual({ type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.SELECT_MONSTER_SET, index: 0 });
  });

  it('Main Phase: magia baixável usa o índice da lista de spell_sets', () => {
    expect(cardActions(msg('idle_bp_ep'), hand(2))).toEqual([
      { label: 'Baixar', response: { type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.SELECT_SPELL_SET, index: 0 } },
    ]);
  });

  it('"Ativar" vem antes de "Baixar" na mesma carta', () => {
    const base = msg('idle_bp_ep') as OcgMessage & { activates: CardRef[]; spell_sets: CardRef[] };
    const m = { ...base, activates: [{ ...base.spell_sets[0], description: 0n }] } as unknown as OcgMessage;
    expect(labels(m, hand(2))).toEqual(['Ativar', 'Baixar']);
  });

  it('carta sem ação no prompt', () => {
    expect(labels(msg('idle_bp_ep'), hand(0))).toEqual([]);
  });

  it('Battle Phase: ataque direto e ataque comum', () => {
    expect(labels(msg('battle_direct'), mzone(1))).toEqual(['Ataque direto']);
    const atk = cardActions(msg('battle_attack'), mzone(2));
    expect(atk).toEqual([{ label: 'Atacar', primary: true, response: { type: OcgResponseType.SELECT_BATTLECMD, action: SelectBattleCMDAction.SELECT_BATTLE, index: 0 } }]);
  });

  it('corrente: ativar a carta oferecida', () => {
    expect(cardActions(msg('chain'), szone(3))).toEqual([{ label: 'Ativar', primary: true, response: { type: OcgResponseType.SELECT_CHAIN, index: 0 } }]);
  });

  it('prompts que não são de tocar na carta não dão ações', () => {
    expect(labels(msg('select_tribute'), mzone(1))).toEqual([]);
  });
});

describe('highlighted', () => {
  it('marca todas as cartas com ação', () => {
    expect([...highlighted(msg('idle_bp_ep'))].sort()).toEqual(['0:2:1', '0:2:2']);
    expect([...highlighted(msg('battle_attack'))].sort()).toEqual(['0:4:2']);
    expect([...highlighted(msg('chain'))]).toEqual(['0:8:3']);
  });

  it('nada marcado fora dos prompts de carta', () => {
    expect(highlighted(null).size).toBe(0);
    expect(highlighted(msg('select_card')).size).toBe(0);
  });

  it('refKey usa controlador:local:sequência', () => {
    expect(refKey(mzone(3))).toBe('0:4:3');
  });
});

describe('sideActions', () => {
  it('Main Phase 1 com batalha: só BATALHA (sem atalho para encerrar)', () => {
    expect(sideActions(msg('idle_bp_ep'))).toEqual([
      { label: 'BATALHA', size: 'big', response: { type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.TO_BP, index: null } },
    ]);
  });

  it('sem batalha disponível: só FIM DO TURNO', () => {
    expect(sideActions(msg('idle_ep_only')).map((a) => [a.label, a.size])).toEqual([['FIM DO TURNO', 'big']]);
  });

  it('Battle Phase: só FIM DO TURNO (o Speed Duel não tem Main Phase 2)', () => {
    expect(sideActions(msg('battle_attack'))).toEqual([
      { label: 'FIM DO TURNO', size: 'big', response: { type: OcgResponseType.SELECT_BATTLECMD, action: SelectBattleCMDAction.TO_EP, index: null } },
    ]);
  });

  it('outros prompts e nenhum prompt: sem botões', () => {
    expect(sideActions(msg('chain'))).toEqual([]);
    expect(sideActions(null)).toEqual([]);
  });
});

describe('phaseChips', () => {
  it('cinco chips (sem M2), só a fase atual acesa (a Battle Phase agrupa os sub-passos)', () => {
    expect(phaseChips(4)).toEqual([
      { label: 'DP', on: false }, { label: 'SP', on: false }, { label: 'M1', on: true },
      { label: 'BP', on: false }, { label: 'EP', on: false },
    ]);
    expect(phaseChips(32).filter((c) => c.on).map((c) => c.label)).toEqual(['BP']);
    expect(phaseChips(0).some((c) => c.on)).toBe(false);
  });
});
