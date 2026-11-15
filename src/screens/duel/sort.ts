/**
 * Ordenar cartas (MSG_SORT_CARD, ex.: "Classificar Livro de Magia" com o topo do Deck).
 *
 * A interface guarda a ordem como lista de índices da mensagem, na ordem em que aparecem (posição 0 = topo).
 * O motor quer o contrário: para cada carta da mensagem, a posição nova dela (`order[i]` = posição da carta i).
 */

/** Ordem inicial: a mesma da mensagem. */
export const initialOrder = (count: number) => Array.from({ length: count }, (_, i) => i);

/** Move o item da posição `from` para `to`, sem mexer na lista original. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const out = [...list];
  const [item] = out.splice(from, 1);
  out.splice(Math.max(0, Math.min(to, out.length)), 0, item);
  return out;
}

/** Converte a ordem mostrada (índices da mensagem) na resposta do motor (posição de cada carta). */
export function sortResponseOrder(display: readonly number[]): number[] {
  const order = new Array<number>(display.length);
  display.forEach((cardIndex, position) => { order[cardIndex] = position; });
  return order;
}

/** Posição de destino de um arrasto: quantas "larguras de carta" o dedo andou, limitado à lista. */
export const dropIndex = (from: number, dx: number, step: number, count: number) =>
  Math.max(0, Math.min(count - 1, from + Math.round(dx / step)));
