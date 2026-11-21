import { describe, expect, it } from 'vitest';
import type { CardRecord } from '../../engine/session';
import { addRefusal } from '../../game/decks';
import { deckGroups, filterCode, sortCodes, trunkSummary, type SortContext } from './trunk';

const T = { MONSTER: 0x1, SPELL: 0x2, TRAP: 0x4, NORMAL: 0x10, EFFECT: 0x20, FUSION: 0x40 };
const card = (code: number, name: string, type: number, extra: Partial<CardRecord> = {}) =>
  ({ code, name, type, level: 4, attack: 1000, defense: 1000, attribute: 0x1, race: '1', desc: '', ...extra }) as unknown as CardRecord;
const cards: Record<string, CardRecord> = {
  1: card(1, 'Dragão Branco', T.MONSTER | T.NORMAL, { level: 8, attack: 3000, attribute: 0x10 }),
  2: card(2, 'Castor Guerreiro', T.MONSTER | T.NORMAL, { attack: 1200 }),
  3: card(3, 'Mago Negro', T.MONSTER | T.NORMAL, { level: 7, attack: 2500, attribute: 0x20 }),
  4: card(4, 'Buraco Negro', T.SPELL),
  5: card(5, 'Força Espelho', T.TRAP),
  6: card(6, 'Dragão Negro', T.MONSTER | T.FUSION | T.EFFECT, { level: 9, attack: 3200 }),
  7: card(7, 'Sangan', T.MONSTER | T.EFFECT, { level: 3, attack: 1000 }),
};
const ctx: SortContext = { cards, tiers: { 1: 'UR', 3: 'SR' }, owned: { 1: 1, 2: 3, 3: 1, 4: 2, 5: 1, 6: 1, 7: 2 }, acquired: [2, 4, 5, 7, 1, 3, 6] };
const all = [1, 2, 3, 4, 5, 6, 7];

describe('ordenar a maleta', () => {
  it('tipo de carta: Normal, Efeito, Fusão, Magia, Armadilha', () => {
    expect(sortCodes(all, { key: 'cardType', reversed: false }, ctx)).toEqual([1, 3, 2, 7, 6, 4, 5]);
  });
  it('ATK: maior primeiro, magias e armadilhas depois dos monstros, também invertido', () => {
    expect(sortCodes(all, { key: 'attack', reversed: false }, ctx)).toEqual([6, 1, 3, 2, 7, 4, 5]);
    expect(sortCodes(all, { key: 'attack', reversed: true }, ctx).slice(0, 5)).toEqual([7, 2, 3, 1, 6]);
    expect(sortCodes(all, { key: 'attack', reversed: true }, ctx).slice(5)).toEqual([4, 5]);
  });
  it('nome invertido vai de Z para A', () => {
    expect(sortCodes(all, { key: 'name', reversed: true }, ctx).map((c) => cards[c].name)[0]).toBe('Sangan');
  });
  it('obtenção: mais novas primeiro; sem a ordem, o código decide', () => {
    expect(sortCodes(all, { key: 'acquisition', reversed: false }, ctx)[0]).toBe(6);
    expect(sortCodes(all, { key: 'acquisition', reversed: false }, { ...ctx, acquired: undefined })[0]).toBe(7);
  });
  it('atributo na ordem do jogo (Trevas antes de Luz)', () => {
    expect(sortCodes([1, 3], { key: 'attribute', reversed: false }, ctx)).toEqual([3, 1]);
  });
  it('raridade e cópias', () => {
    expect(sortCodes(all, { key: 'rarity', reversed: false }, ctx).slice(0, 2)).toEqual([1, 3]);
    expect(sortCodes(all, { key: 'copies', reversed: false }, ctx)[0]).toBe(2);
  });
});

describe('filtro e busca', () => {
  it('busca sem acento e sem caixa', () => {
    expect(all.filter((c) => filterCode(cards[c], 'all', 'dragao'))).toEqual([1, 6]);
  });
  it('Fusão e Monstros', () => {
    expect(all.filter((c) => filterCode(cards[c], 'fus', ''))).toEqual([6]);
    expect(all.filter((c) => filterCode(cards[c], 'mon', ''))).toEqual([1, 2, 3, 7]);
  });
  it('resumo da alça', () => {
    expect(trunkSummary({ key: 'attack', reversed: true }, 'mon', ' dragão ')).toBe('ATK (invertido) · Monstros · “dragão”');
  });
});

describe('grupos do deck', () => {
  it('Normais, Efeito, Magias, Armadilhas e o Extra à parte', () => {
    const g = deckGroups({ main: [4, 2, 2, 7, 5, 1], extra: [6] }, cards);
    expect(g.map((x) => x.title)).toEqual(['Monstros Normais', 'Monstros de Efeito', 'Magias', 'Armadilhas', 'Extra Deck']);
    expect(g[0].codes).toEqual([1, 2, 2]);
    expect(g[4]).toMatchObject({ extra: true, codes: [6] });
  });
});

describe('recusa ao pôr', () => {
  const deck = (main: number[], extra: number[] = []) => ({ main, extra });
  it('cada motivo', () => {
    expect(addRefusal(deck([2, 2, 2]), 2, cards, { 2: 4 })).toBe('Máximo de 3 cópias');
    expect(addRefusal(deck([1]), 1, cards, { 1: 1 })).toBe('Você só tem 1 cópia');
    expect(addRefusal(deck(Array(30).fill(4)), 2, cards, { 2: 1 })).toBe('O deck principal está cheio');
    expect(addRefusal(deck(Array(29).fill(4)), 2, cards, { 2: 1 })).toBeNull();
    expect(addRefusal(deck([], Array(5).fill(7)), 6, cards, { 6: 1 })).toBe('O Extra Deck está cheio');
    expect(addRefusal(deck([]), 2, cards, { 2: 1 })).toBeNull();
  });
  it('limitada: 1 cópia', () => {
    const pot = { 55144522: card(55144522, 'Pote da Ganância', T.SPELL) };
    expect(addRefusal(deck([55144522]), 55144522, pot, { 55144522: 3 })).toBe('Máximo de 1 cópia');
  });
});
