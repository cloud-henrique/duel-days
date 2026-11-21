// Valida a economia da campanha (change `campanha-dm`): pacotes de cada coleção e de personagem (tamanho, raridade do
// slot perto de 70/20/10, toda carta existe no cards.json) e o deck inicial e os decks dos oponentes (válidos).
// Uso: npx tsx proto/economy-smoke.ts
import { readFileSync } from 'node:fs';
import { PACKS, DUELISTS } from '../src/campaign/data/types';
import { duelistDeck, starterCards, starterDeck } from '../src/campaign/decks';
import { draw } from '../src/campaign/packs';
import { generator } from '../src/campaign/rng';
import { validateDeck } from '../src/game/decks';
import type { CardRecord } from '../src/engine/session';

const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')) as Record<string, CardRecord>;
const N = 10000;
let fail = false;
for (const pack of PACKS) {
  const slot: Record<string, number> = { rare: 0, super: 0, ultra: 0 };
  for (let i = 0; i < N; i++) {
    const pulls = draw(pack, generator(7, i));
    if (pulls.length !== 5) throw new Error(`${pack.key}: pacote com ${pulls.length} cartas`);
    for (const p of pulls) if (!cards[p.id]) throw new Error(`${pack.key}: carta ${p.id} fora do cards.json`);
    slot[pulls[4].rarity]++;
  }
  const pct = Object.fromEntries(Object.entries(slot).map(([k, v]) => [k, +(100 * v / N).toFixed(1)]));
  console.log(pack.key.padEnd(8), pack.name.padEnd(36), pct);
  if (Math.abs(pct.rare - 70) > 2 || Math.abs(pct.super - 20) > 2 || Math.abs(pct.ultra - 10) > 2) fail = true;
}
const check = (name: string, d: { main: number[]; extra: number[] }) => {
  const problems = validateDeck(d, cards);
  console.log(name.padEnd(10), d.main.length, '+', d.extra.length, problems.length ? problems : 'ok');
  if (problems.length) fail = true;
};
check('inicial', starterDeck());
// Speed Duel: o deck ativo inicial (30) sai da coleção inicial (as 40 do nativo).
{
  const left = [...starterCards()];
  const missing = starterDeck().main.filter((id) => { const i = left.indexOf(id); if (i < 0) return true; left.splice(i, 1); return false; });
  console.log('coleção  ', starterCards().length, missing.length ? `faltam ${missing}` : 'contém o deck inicial');
  if (missing.length || starterCards().length !== 40) fail = true;
}
for (const d of DUELISTS) check(d.key, duelistDeck(d.key));
if (fail) throw new Error('economia com problemas');
