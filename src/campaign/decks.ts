/** Decks da campanha (as receitas escolhidas, do `decks.json`) como listas de ids, no formato que o duelo recebe. */
import { CAMPAIGN, duelistByKey, type DeckEntry, type DuelistData } from './data/types';

export interface DuelDeck { main: number[]; extra: number[] }

export const expand = (entries: DeckEntry[]): number[] => entries.flatMap((e) => Array<number>(e.count).fill(e.id));

export const duelist = (key: string): DuelistData => {
  const d = duelistByKey(key);
  if (!d) throw new Error(`duelista desconhecido: ${key}`);
  return d;
};

export const duelistDeck = (key: string): DuelDeck => {
  const d = duelist(key);
  return { main: expand(d.deck.main), extra: expand(d.deck.extra) };
};

export const starterDeck = (): DuelDeck => ({ main: expand(CAMPAIGN.starterDeck.main), extra: [] });
