// Valida packs (distribuição e garantia) e a coleção inicial (deck válido de 40 cartas).
import { readFileSync } from 'node:fs';
import { makeRng } from '../src/engine/cpu';
import { openPack, PACK_SIZE, type Tier } from '../src/game/packs';
import { starterCollection, validateDeck } from '../src/game/decks';
import type { CardRecord } from '../src/engine/session';

const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const tiers = JSON.parse(readFileSync('public/data/pool.json', 'utf8')) as Record<string, Tier>;
const rng = makeRng(123);
const counts: Record<string, number> = { N: 0, R: 0, SR: 0, UR: 0 };
let noRare = 0; const N = 20000;
for (let i = 0; i < N; i++) {
  const p = openPack(tiers, rng);
  if (p.length !== PACK_SIZE) throw new Error('tamanho do pack errado');
  p.forEach((c) => { counts[c.tier]++; if (tiers[c.code] !== c.tier) throw new Error('raridade inconsistente'); });
  if (!p.some((c) => c.tier !== 'N')) noRare++;
}
const total = N * PACK_SIZE;
console.log('raridade por carta:', Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, (100 * v / total).toFixed(1) + '%'])), '| packs sem nenhuma rara:', noRare);
if (noRare) throw new Error('garantia de raridade falhou');
const col = starterCollection(cards, tiers, 7);
const main = Object.entries(col).flatMap(([id, n]) => Array(n).fill(Number(id)));
const problems = validateDeck({ main, extra: [] }, cards, col);
console.log('coleção inicial:', main.length, 'cartas,', Object.keys(col).length, 'distintas | problemas:', problems);
if (problems.length) throw new Error('deck inicial inválido');
