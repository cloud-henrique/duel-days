import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR, PLAYER_AVATARS, cleanName, playerStats, profileOf, say, welcomeTitle } from './profile';

describe('profileOf', () => {
  it('save antigo: o nome do save, o primeiro avatar e o tratamento neutro', () => {
    expect(profileOf({ playerName: 'Ana' })).toEqual({ name: 'Ana', avatar: DEFAULT_AVATAR, address: 'neutral' });
  });
  it('save novo: mantém o que foi escolhido', () => {
    expect(profileOf({ playerName: 'Ana', avatar: PLAYER_AVATARS[3].id, address: 'she' })).toEqual({ name: 'Ana', avatar: PLAYER_AVATARS[3].id, address: 'she' });
  });
  it('avatar desconhecido (ex.: o Yugi) e tratamento estranho voltam ao padrão', () => {
    expect(profileOf({ playerName: 'Ana', avatar: 'yugi_muto', address: 'x' as never })).toMatchObject({ avatar: DEFAULT_AVATAR, address: 'neutral' });
  });
});

describe('avatares', () => {
  it('14 duelistas genéricos, sem repetir e sem personagem da série', () => {
    expect(PLAYER_AVATARS).toHaveLength(14);
    expect(new Set(PLAYER_AVATARS.map((a) => a.id)).size).toBe(14);
    expect(PLAYER_AVATARS.every((a) => a.id.startsWith('npc_duelists_'))).toBe(true);
  });
});

describe('cleanName', () => {
  it('tira os espaços das pontas e corta em 20', () => {
    expect(cleanName('  Ana  ')).toBe('Ana');
    expect(cleanName('a'.repeat(25))).toHaveLength(20);
    expect(cleanName('   ')).toBe('');
  });
});

describe('playerStats', () => {
  it('3 vitórias e 1 derrota: 75%', () => {
    expect(playerStats({ wins: { joey: 2, bakura: 1 }, losses: { kaiba: 1 } })).toEqual({ wins: 3, losses: 1, rate: 75 });
  });
  it('sem duelos: sem aproveitamento', () => {
    expect(playerStats({ wins: {}, losses: {} })).toEqual({ wins: 0, losses: 0, rate: null });
  });
});

describe('tratamento', () => {
  it('os três tratamentos', () => {
    const f = { he: 'Bem-vindo', she: 'Bem-vinda', neutral: 'Boas-vindas' };
    expect(say('he', f)).toBe('Bem-vindo');
    expect(say('she', f)).toBe('Bem-vinda');
    expect(say('neutral', f)).toBe('Boas-vindas');
  });
  it('título das boas-vindas', () => {
    expect(welcomeTitle('she', 'Ana')).toBe('Bem-vinda ao Duel Days, Ana!');
    expect(welcomeTitle('neutral')).toBe('Boas-vindas ao Duel Days!');
  });
});
