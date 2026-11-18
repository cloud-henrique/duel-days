import type { CardRecord, DeckList } from '../engine/session';
import { makeRng } from '../engine/cpu';

export const MAIN_MIN = 40, MAIN_MAX = 60, EXTRA_MAX = 15, MAX_COPIES = 3;
/** Cartas limitadas a 1 cópia, como no nativo (`DeckRules.classic`). */
export const LIMITED: ReadonlySet<number> = new Set([
  55144522, // Pot of Greed
  12580477, // Raigeki
  53129443, // Dark Hole
  83764718, // Monster Reborn
  44095762, // Mirror Force
]);
export const maxCopiesOf = (code: number) => (LIMITED.has(code) ? 1 : MAX_COPIES);
export interface Deck extends DeckList { id: string; name: string }
type Cards = Record<string, CardRecord>;

/** Fusão, Sincro, Xyz e Link vão para o Extra Deck. */
export const isExtraCard = (c: CardRecord) => (c.type & (0x40 | 0x2000 | 0x800000 | 0x4000000)) !== 0;

export const count = (list: number[]) => list.reduce<Record<number, number>>((m, c) => ((m[c] = (m[c] ?? 0) + 1), m), {});

/**
 * Por que a carta não pode entrar no deck agora (as mensagens do nativo), ou `null` se pode. `owned` são as cópias da
 * coleção; o limite é o menor entre a regra (3, ou 1 nas limitadas) e o que o jogador tem.
 */
export function addRefusal(d: DeckList, code: number, cards: Cards, owned: Record<string, number>): string | null {
  const c = cards[String(code)];
  if (!c) return 'Carta desconhecida';
  const inDeck = [...d.main, ...d.extra].filter((x) => x === code).length;
  const have = owned[String(code)] ?? 0;
  const rule = maxCopiesOf(code);
  const plural = (n: number) => `${n} cópia${n === 1 ? '' : 's'}`;
  if (inDeck >= rule) return `Máximo de ${plural(rule)}`;
  if (inDeck >= have) return `Você só tem ${plural(have)}`;
  if (isExtraCard(c) ? d.extra.length >= EXTRA_MAX : d.main.length >= MAIN_MAX)
    return isExtraCard(c) ? 'O Extra Deck está cheio' : 'O deck principal está cheio';
  return null;
}

/** Lista de problemas do deck (vazia = válido). Com `owned`, também confere a coleção. */
export function validateDeck(d: DeckList, cards: Cards, owned?: Record<string, number>): string[] {
  const out: string[] = [];
  if (d.main.length < MAIN_MIN) out.push(`Faltam ${MAIN_MIN - d.main.length} cartas no deck principal (mínimo ${MAIN_MIN}).`);
  if (d.main.length > MAIN_MAX) out.push(`Deck principal com ${d.main.length} cartas (máximo ${MAIN_MAX}).`);
  if (d.extra.length > EXTRA_MAX) out.push(`Extra Deck com ${d.extra.length} cartas (máximo ${EXTRA_MAX}).`);
  const all = count([...d.main, ...d.extra]);
  for (const [code, n] of Object.entries(all)) {
    const c = cards[code];
    if (!c) { out.push(`Carta desconhecida: ${code}.`); continue; }
    if (n > maxCopiesOf(Number(code))) out.push(`${c.name}: ${n} cópias (máximo ${maxCopiesOf(Number(code))}).`);
    if (owned && n > (owned[code] ?? 0)) out.push(`${c.name}: você tem só ${owned[code] ?? 0}.`);
  }
  for (const code of d.main) if (cards[code] && isExtraCard(cards[code])) { out.push(`${cards[code].name} deve ir no Extra Deck.`); break; }
  for (const code of d.extra) if (cards[code] && !isExtraCard(cards[code])) { out.push(`${cards[code].name} não pode ir no Extra Deck.`); break; }
  return out;
}

/** Deck aleatório válido (inimigos e testes): 18 monstros, 12 magias, 10 armadilhas, cópias até 2. */
export function randomDeck(cards: Cards, poolIds: number[], seed: number): DeckList {
  const rng = makeRng(seed);
  const ids = poolIds.filter((id) => cards[id]);
  const by = (f: (c: CardRecord) => boolean) => ids.filter((id) => f(cards[id]) && !isExtraCard(cards[id]));
  const pick = (pool: number[], n: number) => {
    const main: number[] = []; const used: Record<number, number> = {};
    for (let guard = 0; main.length < n && guard < 5000; guard++) {
      const id = pool[Math.floor(rng() * pool.length)];
      if ((used[id] ?? 0) >= 2) continue;
      used[id] = (used[id] ?? 0) + 1; main.push(id);
    }
    return main;
  };
  const main = [...pick(by((c) => (c.type & 1) !== 0), 18), ...pick(by((c) => (c.type & 2) !== 0), 12), ...pick(by((c) => (c.type & 4) !== 0), 10)];
  const extras = ids.filter((id) => isExtraCard(cards[id]));
  const extra = Array.from({ length: Math.min(4, extras.length) }, () => extras[Math.floor(rng() * extras.length)]);
  return { main, extra: [...new Set(extra)] };
}

/** Coleção inicial: 40 cartas Normais (monstros, magias, armadilhas), até 3 cópias — forma um deck válido por inteiro. */
export function starterCollection(cards: Cards, tiers: Record<string, string>, seed: number): Record<string, number> {
  const rng = makeRng(seed);
  const commons = Object.keys(tiers).filter((id) => tiers[id] === 'N' && cards[id] && !isExtraCard(cards[id]));
  const want: [(c: CardRecord) => boolean, number][] = [[(c) => (c.type & 1) !== 0, 22], [(c) => (c.type & 2) !== 0, 10], [(c) => (c.type & 4) !== 0, 8]];
  const out: Record<string, number> = {};
  for (const [f, n] of want) {
    const pool = commons.filter((id) => f(cards[id]));
    for (let added = 0, guard = 0; added < n && guard < 5000; guard++) {
      const id = pool[Math.floor(rng() * pool.length)];
      if ((out[id] ?? 0) >= 2) continue;
      out[id] = (out[id] ?? 0) + 1; added++;
    }
  }
  return out;
}
