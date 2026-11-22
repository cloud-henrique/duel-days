import { useStored } from '../screens/deck/useStored';

/**
 * Tamanho das cartas nas grades da tela larga (change layout-desktop-telas): P, M ou G é a largura-alvo de uma carta, e
 * as colunas saem da largura disponível (`colsFor` em `virtualGrid.ts`). Ajuste do aparelho, M por padrão. No retrato
 * as grades têm as colunas fixas de sempre.
 */
export type CardSize = 'P' | 'M' | 'G';
export const CARD_SIZES: Record<CardSize, number> = { P: 84, M: 108, G: 148 };
export const CARD_SIZE_ORDER: CardSize[] = ['P', 'M', 'G'];
export const CARD_SIZE_NAME: Record<CardSize, string> = { P: 'pequenas', M: 'médias', G: 'grandes' };
export const CARD_SIZE_KEY = 'duel-days.cardSize';
export const DEFAULT_CARD_SIZE: CardSize = 'M';

export const isCardSize = (v: unknown): v is CardSize => v === 'P' || v === 'M' || v === 'G';
/** O próximo tamanho no ciclo P → M → G → P. */
export const nextCardSize = (s: CardSize): CardSize => CARD_SIZE_ORDER[(CARD_SIZE_ORDER.indexOf(s) + 1) % CARD_SIZE_ORDER.length];

/** O tamanho escolhido neste aparelho e como trocá-lo. */
export function useCardSize(): [CardSize, (s: CardSize) => void] {
  return useStored<CardSize>(CARD_SIZE_KEY, DEFAULT_CARD_SIZE, isCardSize);
}
