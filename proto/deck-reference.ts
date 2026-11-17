// Grava raw/decks/reference.json: o grupo de referência do torneio de receitas (proto/deck-pick.ts), com os decks do
// nativo do Tier 1 e o deck inicial. Rode uma vez antes de trocar os decks da campanha pelas receitas.
import { writeFileSync } from 'node:fs';
import { TIERS } from '../src/campaign/data/types';
import { duelistDeck, starterDeck } from '../src/campaign/decks';

const ref: Record<string, unknown> = { inicial: starterDeck() };
for (const d of TIERS[0].duelists) ref[`nativo-${d.key}`] = duelistDeck(d.key);
writeFileSync('raw/decks/reference.json', JSON.stringify(ref));
console.log('ok:', Object.keys(ref).join(', '));
