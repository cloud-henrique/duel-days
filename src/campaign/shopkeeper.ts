/** As falas do balconista da loja (o vovô), escolhidas pela semente da campanha: nada de `Math.random`. */
import { DIALOGUE, type Expression, type ShopkeeperDialogue } from './data/types';
import { PURPOSE, generator, randInt } from './rng';
import { fillText, type Address } from './text';

export type ShopLineKind = Exclude<keyof ShopkeeperDialogue, 'character'>;
export interface ShopLine { text: string; expression: Expression }

export const SHOPKEEPER = DIALOGUE.shopkeeper;

/** A fala do grupo `kind` pela semente e por um contador (cada fala da visita avança o contador). */
export function shopLine(kind: ShopLineKind, seed: number, n: number, who: { name: string; address: Address }): ShopLine {
  const lines = SHOPKEEPER[kind];
  const kinds: ShopLineKind[] = ['welcome', 'boughtPack', 'boughtBox', 'pulledUltra', 'noFunds'];
  const line = lines[randInt(generator(PURPOSE.shopkeeper, seed, n, kinds.indexOf(kind)), lines.length)];
  return { text: fillText(line.text, who.name, who.address), expression: line.expression };
}
