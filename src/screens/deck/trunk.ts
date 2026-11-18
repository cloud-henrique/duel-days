/**
 * A maleta do editor e da Coleção, pura (`TrunkSort`/`CardFilter` do nativo): ordenar, filtrar, buscar e agrupar o
 * deck. Os textos da tela também saem daqui.
 */
import { OcgType } from 'ocgcore-wasm';
import type { CardRecord } from '../../engine/session';
import type { Tier } from '../../data/cards';
import { raceName } from '../../data/labels';
import { isExtraCard } from '../../game/decks';

export type SortKey = 'cardType' | 'level' | 'attack' | 'defense' | 'name' | 'attribute' | 'monsterType' | 'rarity' | 'copies' | 'acquisition';
export interface TrunkSort { key: SortKey; reversed: boolean }
export type Kind = 'all' | 'mon' | 'fus' | 'mag' | 'arm';

export const SORT_KEYS: SortKey[] = ['cardType', 'level', 'attack', 'defense', 'name', 'attribute', 'monsterType', 'rarity', 'copies', 'acquisition'];
export const SORT_NAME: Record<SortKey, string> = {
  cardType: 'Tipo de carta', level: 'Nível', attack: 'ATK', defense: 'DEF', name: 'Nome', attribute: 'Atributo',
  monsterType: 'Tipo de monstro', rarity: 'Raridade', copies: 'Cópias', acquisition: 'Obtenção',
};
/** O sentido de cada chave, no normal e no invertido (o subtítulo do botão de ordem). */
export const SORT_DIRECTION: Record<SortKey, [string, string]> = {
  cardType: ['Normal → Armadilha', 'Armadilha → Normal'],
  level: ['Maior primeiro', 'Menor primeiro'], attack: ['Maior primeiro', 'Menor primeiro'],
  defense: ['Maior primeiro', 'Menor primeiro'], copies: ['Maior primeiro', 'Menor primeiro'],
  name: ['A → Z', 'Z → A'], monsterType: ['A → Z', 'Z → A'],
  attribute: ['Ordem do jogo', 'Ordem inversa'],
  rarity: ['Mais raras primeiro', 'Mais comuns primeiro'],
  acquisition: ['Mais novas primeiro', 'Mais antigas primeiro'],
};
export const KINDS: [Kind, string][] = [['all', 'Todas'], ['mon', 'Monstros'], ['fus', 'Fusão'], ['mag', 'Magias'], ['arm', 'Armadilhas']];
export const DEFAULT_SORT: TrunkSort = { key: 'cardType', reversed: false };

const MONSTER_KEYS = new Set<SortKey>(['level', 'attack', 'defense', 'attribute', 'monsterType']);
const isMon = (c: CardRecord) => (c.type & OcgType.MONSTER) !== 0;

/** Normal → Efeito (e Ritual) → Fusão → Magia → Armadilha. */
export function typeRank(c: CardRecord): number {
  if (c.type & OcgType.SPELL) return 3;
  if (c.type & OcgType.TRAP) return 4;
  if (isExtraCard(c)) return 2;
  return c.type & (OcgType.EFFECT | OcgType.RITUAL) ? 1 : 0;
}
const level = (c: CardRecord) => (isMon(c) ? c.level & 0xff : 0);
/** ATK/DEF "?" (negativo no motor, ou sem sinal) contam como 0 para ordenar. */
const stat = (v: number) => (v < 0 || v >= 0x7fffffff ? 0 : v);
/** A ordem do jogo dos atributos: Trevas, Luz, Terra, Água, Fogo, Vento, Divino (bits do motor). */
const ATTR_ORDER = [0x20, 0x10, 0x01, 0x02, 0x04, 0x08, 0x40];
const attrRank = (c: CardRecord) => { const i = ATTR_ORDER.indexOf(c.attribute); return i < 0 ? ATTR_ORDER.length : i; };
const TIER_RANK: Record<Tier, number> = { UR: 0, SR: 1, R: 2, N: 3 };
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export interface SortContext {
  cards: Record<string, CardRecord>;
  tiers: Record<string, Tier>;
  owned: Record<string, number>;
  /** Ordem de obtenção (save antigo: vazia, e o id decide). */
  acquired?: number[];
}

/** Ordena os códigos: a chave decide (o "inverter" troca só ela), monstros primeiro nas chaves de monstro, e os
 *  empates seguem tipo → nível (maior) → nome → código, sempre no sentido normal. */
export function sortCodes(codes: number[], sort: TrunkSort, ctx: SortContext): number[] {
  const rankAcq = new Map((ctx.acquired ?? []).map((id, i) => [id, i]));
  const card = (id: number) => ctx.cards[String(id)];
  const primary = (a: number, b: number): number => {
    const A = card(a), B = card(b);
    switch (sort.key) {
      case 'cardType': return typeRank(A) - typeRank(B);
      case 'level': return level(B) - level(A);
      case 'attack': return stat(B.attack) - stat(A.attack);
      case 'defense': return stat(B.defense) - stat(A.defense);
      case 'name': return collator.compare(A.name, B.name);
      case 'attribute': return attrRank(A) - attrRank(B);
      case 'monsterType': return collator.compare(raceName(A.race), raceName(B.race));
      case 'rarity': return (TIER_RANK[ctx.tiers[String(a)]] ?? 3) - (TIER_RANK[ctx.tiers[String(b)]] ?? 3);
      case 'copies': return (ctx.owned[String(b)] ?? 0) - (ctx.owned[String(a)] ?? 0);
      case 'acquisition': return (rankAcq.get(b) ?? -1) - (rankAcq.get(a) ?? -1) || (rankAcq.size ? 0 : b - a);
    }
  };
  const tie = (a: number, b: number) => {
    const A = card(a), B = card(b);
    return typeRank(A) - typeRank(B) || level(B) - level(A) || collator.compare(A.name, B.name) || a - b;
  };
  return codes.filter((id) => card(id)).sort((a, b) => {
    if (MONSTER_KEYS.has(sort.key)) {
      const ma = isMon(card(a)), mb = isMon(card(b));
      if (ma !== mb) return ma ? -1 : 1;
    }
    const p = primary(a, b) * (sort.reversed ? -1 : 1);
    return p || tie(a, b);
  });
}

/** Sem acento e sem caixa: "dragao" acha "Dragão". */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function filterCode(c: CardRecord | undefined, kind: Kind, query: string): boolean {
  if (!c) return false;
  const q = fold(query.trim());
  if (q && !fold(c.name).includes(q)) return false;
  switch (kind) {
    case 'mon': return isMon(c) && !isExtraCard(c);
    case 'fus': return isExtraCard(c);
    case 'mag': return (c.type & OcgType.SPELL) !== 0;
    case 'arm': return (c.type & OcgType.TRAP) !== 0;
    default: return true;
  }
}

export interface DeckGroup { title: string; codes: number[]; extra?: boolean }
const GROUPS: [string, (c: CardRecord) => boolean][] = [
  ['Monstros Normais', (c) => typeRank(c) === 0],
  ['Monstros de Efeito', (c) => typeRank(c) === 1],
  ['Magias', (c) => typeRank(c) === 3],
  ['Armadilhas', (c) => typeRank(c) === 4],
];
/** O deck no painel: grupos do principal (só os que têm cartas; cada cópia é um item) e o Extra à parte. */
export function deckGroups(deck: { main: number[]; extra: number[] }, cards: Record<string, CardRecord>): DeckGroup[] {
  const ctx: SortContext = { cards, tiers: {}, owned: {} };
  const ordered = (ids: number[]) => sortCodes([...ids], DEFAULT_SORT, ctx);
  const out: DeckGroup[] = GROUPS.map(([title, test]) => ({ title, codes: ordered(deck.main.filter((id) => cards[String(id)] && test(cards[String(id)]))) }))
    .filter((g) => g.codes.length);
  // O que não coube num grupo (ex.: uma Fusão no principal, que é um problema) vai junto dos de Efeito no fim.
  const shown = new Set(out.flatMap((g) => g.codes));
  const rest = deck.main.filter((id) => !shown.has(id));
  if (rest.length) out.push({ title: 'Outras', codes: ordered(rest) });
  if (deck.extra.length) out.push({ title: 'Extra Deck', codes: ordered(deck.extra), extra: true });
  return out;
}

/** O resumo da alça recolhida: "ATK · Monstros · “dragão”". */
export function trunkSummary(sort: TrunkSort, kind: Kind, query: string): string {
  const parts = [`${SORT_NAME[sort.key]}${sort.reversed ? ' (invertido)' : ''}`];
  if (kind !== 'all') parts.push(KINDS.find(([k]) => k === kind)![1]);
  if (query.trim()) parts.push(`“${query.trim()}”`);
  return parts.join(' · ');
}
