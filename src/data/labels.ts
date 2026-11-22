/** Rótulos em português para os campos numéricos do banco de cartas. */
import { OcgType } from 'ocgcore-wasm';

/** Atributo: nome em português e nome do ícone (`public/card-icons/attribute-*.svg`, copiado do nativo). */
const ATTR: Record<number, [string, string]> = {
  1: ['TERRA', 'earth'], 2: ['ÁGUA', 'water'], 4: ['FOGO', 'fire'], 8: ['VENTO', 'wind'], 16: ['LUZ', 'light'], 32: ['TREVAS', 'dark'], 64: ['DIVINO', 'divine'],
};
/** Tipo de monstro: bit, nome em português e ícone do nativo (`type-*.svg`; vazio = o nativo não tem). */
const RACE: [bigint, string, string][] = [
  [0x1n, 'Guerreiro', 'warrior'], [0x2n, 'Mago', 'spellcaster'], [0x4n, 'Fada', 'fairy'], [0x8n, 'Demônio', 'fiend'],
  [0x10n, 'Zumbi', 'zombie'], [0x20n, 'Máquina', 'machine'], [0x40n, 'Aqua', 'aqua'], [0x80n, 'Piro', 'pyro'],
  [0x100n, 'Rocha', 'rock'], [0x200n, 'Besta Alada', 'winged-beast'], [0x400n, 'Planta', 'plant'], [0x800n, 'Inseto', 'insect'],
  [0x1000n, 'Trovão', 'thunder'], [0x2000n, 'Dragão', 'dragon'], [0x4000n, 'Besta', 'beast'], [0x8000n, 'Besta-Guerreiro', 'beast-warrior'],
  [0x10000n, 'Dinossauro', 'dinosaur'], [0x20000n, 'Peixe', 'fish'], [0x40000n, 'Serpente Marinha', 'sea-serpent'], [0x80000n, 'Réptil', 'reptile'],
  [0x100000n, 'Psíquico', ''], [0x200000n, 'Besta Divina', 'divine-beast'], [0x400000n, 'Deus Criador', ''], [0x800000n, 'Wyrm', ''],
  [0x1000000n, 'Ciberso', ''],
];
const raceOf = (r: string) => { const v = BigInt(r || 0); return RACE.find(([bit]) => v & bit); };
export const attrName = (a: number) => ATTR[a]?.[0] ?? '';
export const raceName = (r: string) => raceOf(r)?.[1] ?? '';
/** Nome do ícone (sem extensão) em `public/card-icons/`, ou null se não houver. */
export const attrIcon = (a: number) => (ATTR[a] ? `attribute-${ATTR[a][1]}` : null);
export const raceIcon = (r: string) => { const slug = raceOf(r)?.[2]; return slug ? `type-${slug}` : null; };
/** Propriedade de Magia/Armadilha para o ícone ao lado da linha do tipo (Normal não tem ícone, como nas cartas). */
export const propertyIcon = (type: number) => { const p = propertyOf(type); return p ? `property-${p}` : null; };
export type Property = 'quick-play' | 'continuous' | 'field' | 'equip' | 'ritual' | 'counter';
const PROPERTY: [number, Property][] = [
  [OcgType.QUICKPLAY, 'quick-play'], [OcgType.CONTINUOUS, 'continuous'], [OcgType.FIELD, 'field'],
  [OcgType.EQUIP, 'equip'], [OcgType.RITUAL, 'ritual'], [OcgType.COUNTER, 'counter'],
];
export const propertyOf = (type: number): Property | null =>
  type & (OcgType.SPELL | OcgType.TRAP) ? PROPERTY.find(([bit]) => type & bit)?.[1] ?? null : null;

/** Propriedade de Magia/Armadilha como no Manual Oficial (Equipamento, Campo, Rápida, Ritual, Contínua, Resposta). */
const SPELL_KIND: [number, string][] = [
  [OcgType.EQUIP, 'Magia de Equipamento'], [OcgType.FIELD, 'Magia de Campo'], [OcgType.QUICKPLAY, 'Magia Rápida'],
  [OcgType.RITUAL, 'Magia de Ritual'], [OcgType.CONTINUOUS, 'Magia Contínua'],
];
const TRAP_KIND: [number, string][] = [[OcgType.CONTINUOUS, 'Armadilha Contínua'], [OcgType.COUNTER, 'Armadilha de Resposta']];
/**
 * Classificações do monstro na ordem da linha de tipo impressa (ex.: [Mago/Toon/Efeito]), com os nomes das cartas em
 * português. Quem não é Efeito nem Fusão/Ritual/Ficha é Normal.
 */
const MONSTER_KIND: [number, string][] = [
  [OcgType.FUSION, 'Fusão'], [OcgType.RITUAL, 'Ritual'], [OcgType.SYNCHRO, 'Sincro'], [OcgType.XYZ, 'Xyz'], [OcgType.TOKEN, 'Ficha'],
  [OcgType.TOON, 'Toon'], [OcgType.SPIRIT, 'Espírito'], [OcgType.UNION, 'União'], [OcgType.GEMINI, 'Gêmeos'], [OcgType.TUNER, 'Regulador'],
  [OcgType.FLIP, 'Virar'], [OcgType.EFFECT, 'Efeito'],
];
/** As classificações do monstro, em ordem (ex.: `['Toon', 'Efeito']`, `['Normal']`). */
export function monsterKinds(type: number): string[] {
  const kinds = MONSTER_KIND.filter(([bit]) => type & bit).map(([, name]) => name);
  return kinds.length ? kinds : ['Normal'];
}
/** Monstro Normal (sem efeito): o texto dele é a descrição em itálico, como nas cartas. */
export const isNormalMonster = (type: number) =>
  isMonster(type) && !(type & (OcgType.EFFECT | OcgType.FUSION | OcgType.RITUAL | OcgType.TOKEN | OcgType.SYNCHRO | OcgType.XYZ));
const kindOf = (type: number, table: [number, string][], fallback: string) => table.find(([bit]) => type & bit)?.[1] ?? fallback;

export function typeLine(type: number) {
  if (type & OcgType.SPELL) return kindOf(type, SPELL_KIND, 'Magia Normal');
  if (type & OcgType.TRAP) return kindOf(type, TRAP_KIND, 'Armadilha Normal');
  return `Monstro · ${monsterKinds(type).join('/')}`;
}
export const isMonster = (type: number) => (type & OcgType.MONSTER) !== 0;

/** A partir daqui o valor é um "?" que chegou sem sinal (ex.: 4294967294 = −2). */
const STAT_UNKNOWN_MIN = 0x7fffffff;
/** Único formatador de ATK/DEF da interface: valores "?" (negativos no motor) aparecem como `?`. */
export const formatStat = (v: number | null | undefined) => (v == null || v < 0 || v >= STAT_UNKNOWN_MIN ? '?' : String(v));

/** Moldura da carta impressa (cor da face própria e do halo da ativação). */
export type Frame = 'normal' | 'effect' | 'fusion' | 'ritual' | 'spell' | 'trap' | 'token';
export function frameOf(type: number): Frame {
  if (type & OcgType.SPELL) return 'spell';
  if (type & OcgType.TRAP) return 'trap';
  if (type & OcgType.TOKEN) return 'token';
  if (type & OcgType.FUSION) return 'fusion';
  if (type & OcgType.RITUAL) return 'ritual';
  return type & OcgType.EFFECT ? 'effect' : 'normal';
}

const ATTR_GLYPH: Record<string, [string, string]> = {
  TERRA: ['地', '#8a6a3a'], 'ÁGUA': ['水', '#2f8de0'], FOGO: ['炎', '#e0502f'], VENTO: ['風', '#3cae6a'],
  LUZ: ['光', '#d9b43a'], TREVAS: ['闇', '#7a3fa8'], DIVINO: ['神', '#c9a227'],
};
const KIND_GLYPH: Partial<Record<Frame, [string, string]>> = { spell: ['魔', '#1d9a7a'], trap: ['罠', '#b0337e'] };
/** Ícone oficial do selo do canto da carta (`public/card-icons`): atributo do monstro ou Magia/Armadilha. */
export function faceIcon(type: number, attribute: number): string | null {
  const frame = frameOf(type);
  if (frame === 'spell') return 'card-spell';
  if (frame === 'trap') return 'card-trap';
  return attrIcon(attribute);
}
/** Selo redondo do canto da carta sem os ícones oficiais (não versionados): kanji e cor do atributo ou de Magia/Armadilha. */
export function attrGlyph(type: number, attribute: number): [string, string] {
  return KIND_GLYPH[frameOf(type)] ?? ATTR_GLYPH[attrName(attribute)] ?? ['?', '#555'];
}
