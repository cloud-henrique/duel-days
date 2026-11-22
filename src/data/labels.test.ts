import { describe, expect, it } from 'vitest';
import { OcgType as T } from 'ocgcore-wasm';
import { isNormalMonster, attrGlyph, attrIcon, faceIcon, formatStat, frameOf, isMonster, propertyIcon, propertyOf, raceIcon, typeLine } from './labels';

describe('labels', () => {
  it('reconhece monstro pelo bit de tipo', () => {
    expect(isMonster(0x1)).toBe(true);
    expect(isMonster(0x2)).toBe(false);
  });
});

describe('formatStat', () => {
  it.each([[-2, '?'], [0x7fffffff, '?'], [4294967294, '?'], [undefined, '?'], [0, '0'], [2500, '2500']])('%s → %s', (v, out) => {
    expect(formatStat(v)).toBe(out);
  });
});

describe('frameOf', () => {
  it.each([
    [T.MONSTER | T.NORMAL, 'normal'], [T.MONSTER | T.EFFECT, 'effect'], [T.MONSTER | T.FUSION, 'fusion'],
    [T.MONSTER | T.FUSION | T.EFFECT, 'fusion'], [T.MONSTER | T.RITUAL | T.EFFECT, 'ritual'], [T.SPELL, 'spell'],
    [T.SPELL | 0x80000, 'spell'], [T.TRAP, 'trap'], [T.MONSTER | T.TOKEN | T.NORMAL, 'token'],
  ])('tipo %i → %s', (type, frame) => expect(frameOf(type)).toBe(frame));
});

describe('attrGlyph', () => {
  it('monstro usa o atributo; Magia/Armadilha usam o próprio selo', () => {
    expect(attrGlyph(T.MONSTER, 32)[0]).toBe('闇');
    expect(attrGlyph(T.SPELL, 0)[0]).toBe('魔');
    expect(attrGlyph(T.TRAP, 0)[0]).toBe('罠');
    expect(attrGlyph(T.MONSTER, 0)[0]).toBe('?');
  });
});

describe('typeLine (nomes oficiais do manual)', () => {
  it.each([
    [T.SPELL, 'Magia Normal'], [T.SPELL | T.EQUIP, 'Magia de Equipamento'], [T.SPELL | T.FIELD, 'Magia de Campo'],
    [T.SPELL | T.QUICKPLAY, 'Magia Rápida'], [T.SPELL | T.CONTINUOUS, 'Magia Contínua'], [T.SPELL | T.RITUAL, 'Magia de Ritual'],
    [T.TRAP, 'Armadilha Normal'], [T.TRAP | T.CONTINUOUS, 'Armadilha Contínua'], [T.TRAP | T.COUNTER, 'Armadilha de Resposta'],
    [T.MONSTER | T.NORMAL, 'Monstro · Normal'], [T.MONSTER | T.EFFECT, 'Monstro · Efeito'], [T.MONSTER | T.FUSION, 'Monstro · Fusão'],
    [T.MONSTER | T.FUSION | T.EFFECT, 'Monstro · Fusão/Efeito'], [T.MONSTER | T.TOON | T.EFFECT, 'Monstro · Toon/Efeito'],
    [T.MONSTER | T.SPIRIT | T.EFFECT, 'Monstro · Espírito/Efeito'], [T.MONSTER | T.FLIP | T.EFFECT, 'Monstro · Virar/Efeito'],
  ])('tipo %i → %s', (type, line) => expect(typeLine(type)).toBe(line));
});

describe('isNormalMonster', () => {
  it('só o monstro sem efeito', () => {
    expect(isNormalMonster(T.MONSTER | T.NORMAL)).toBe(true);
    expect(isNormalMonster(T.MONSTER | T.EFFECT)).toBe(false);
    expect(isNormalMonster(T.MONSTER | T.FUSION)).toBe(false);
    expect(isNormalMonster(T.SPELL)).toBe(false);
  });
});

describe('ícones de carta', () => {
  it('atributo e tipo viram o nome do arquivo do nativo', () => {
    expect(attrIcon(1)).toBe('attribute-earth');
    expect(attrIcon(32)).toBe('attribute-dark');
    expect(attrIcon(0)).toBeNull();
    expect(raceIcon('1')).toBe('type-warrior');
    expect(raceIcon(String(0x40000))).toBe('type-sea-serpent');
    expect(raceIcon(String(0x8000))).toBe('type-beast-warrior');
    expect(raceIcon(String(0x100000))).toBeNull(); // Psíquico: o nativo não tem
  });
  it('só Magia Rápida tem ícone de propriedade', () => {
    expect(propertyOf(T.SPELL | T.QUICKPLAY)).toBe('quick-play');
    expect(propertyOf(T.SPELL | T.CONTINUOUS)).toBe('continuous');
    expect(propertyOf(T.SPELL | T.FIELD)).toBe('field');
    expect(propertyOf(T.TRAP | T.COUNTER)).toBe('counter');
    expect(propertyOf(T.SPELL)).toBeNull();
    expect(propertyIcon(T.TRAP | T.CONTINUOUS)).toBe('property-continuous');
    expect(propertyOf(T.MONSTER | T.RITUAL)).toBeNull();
    expect(faceIcon(T.MONSTER, 32)).toBe('attribute-dark');
    expect(faceIcon(T.SPELL, 0)).toBe('card-spell');
    expect(faceIcon(T.TRAP | T.CONTINUOUS, 0)).toBe('card-trap');
  });
});
