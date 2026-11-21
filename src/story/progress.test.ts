import { describe, expect, it } from 'vitest';
import { newCampaign } from '../campaign/state';
import { DEFAULT_SETTINGS, migrate, withDefaults, type Settings } from './progress';

describe('withDefaults', () => {
  it('save antigo, sem settings: animações normais, som e música ligados, pergunta nas correntes', () => {
    expect(withDefaults(undefined)).toEqual({ anim: 'normal', sound: true, music: true, musicVolume: 0.6, chain: 'ask' });
    expect(withDefaults(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('parcial: completa só o que falta', () => {
    expect(withDefaults({ anim: 'fast' })).toEqual({ ...DEFAULT_SETTINGS, anim: 'fast' });
    expect(withDefaults({ sound: false, music: false })).toEqual({ ...DEFAULT_SETTINGS, sound: false, music: false });
  });

  it('completo: mantém', () => {
    const all: Settings = { anim: 'off', sound: false, music: false, musicVolume: 0.2, chain: 'skip' };
    expect(withDefaults(all)).toEqual(all);
  });

  it('valores estranhos voltam ao padrão', () => {
    expect(withDefaults({ anim: 'turbo', sound: 'sim', music: 1, musicVolume: 3, chain: 'nunca' } as unknown as Partial<Settings>)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('migrate', () => {
  it('save da história antiga: mantém perfil, estatísticas e ajustes, e fica sem campanha', () => {
    const old = {
      playerName: 'Ana', avatar: 'npc_duelists_common__emma', address: 'she', settings: { sound: false },
      wins: { joey_wheeler: 3 }, losses: { bakura: 1 }, hearts: { joey_wheeler: 2 }, seen: [], coins: 450,
      collection: { 1: 3 }, decks: [], activeDeck: 'deck1', run: { scene: 'x', state: {} },
    };
    expect(migrate(old)).toEqual({
      playerName: 'Ana', avatar: 'npc_duelists_common__emma', address: 'she', settings: { sound: false },
      wins: { joey_wheeler: 3 }, losses: { bakura: 1 }, campaign: null,
    });
  });

  it('campanha de antes do Speed Duel (versão 1): perfil e estatísticas ficam, a campanha recomeça', () => {
    const v1 = { ...newCampaign(3), version: 1, dp: 900 };
    const out = migrate({ playerName: 'Bia', avatar: 'x', wins: { bakura: 2 }, losses: {}, settings: { music: false }, campaign: v1 });
    expect(out).toEqual({ playerName: 'Bia', avatar: 'x', wins: { bakura: 2 }, losses: {}, settings: { music: false }, campaign: null });
  });

  it('ida e volta com campanha', () => {
    const p = { playerName: 'Rui', wins: {}, losses: {}, campaign: newCampaign(9) };
    expect(migrate(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });

  it('lixo vira "sem save"', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate({ coins: 3 })).toBeNull();
  });
});
