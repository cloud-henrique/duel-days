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

/** As 40 cartas do deck inicial do nativo: a coleção de uma campanha nova. */
export const starterCards = (): number[] => expand(CAMPAIGN.starterDeck.main);

/** O deck ativo inicial (Speed Duel, 30 cartas): o do nativo sem as cartas do `cut`. */
export const starterDeck = (): DuelDeck => {
  const main = starterCards();
  for (const id of expand(CAMPAIGN.starterDeck.cut)) main.splice(main.lastIndexOf(id), 1);
  return { main, extra: [] };
};

/** Perfil da CPU no duelo contra este duelista: o chefe do tier joga como `chefe`, os demais como `comum`. */
export const cpuFor = (key: string): 'comum' | 'chefe' => (duelist(key).isBoss ? 'chefe' : 'comum');
