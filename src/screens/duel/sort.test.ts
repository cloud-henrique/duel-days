import { describe, expect, it } from 'vitest';
import { dropIndex, initialOrder, moveItem, sortResponseOrder } from './sort';

describe('ordenar cartas', () => {
  it('começa na ordem da mensagem', () => {
    expect(initialOrder(3)).toEqual([0, 1, 2]);
  });

  it('move um item sem alterar a lista original', () => {
    const list = [0, 1, 2];
    expect(moveItem(list, 0, 2)).toEqual([1, 2, 0]);
    expect(moveItem(list, 2, 0)).toEqual([2, 0, 1]);
    expect(moveItem(list, 1, 9)).toEqual([0, 2, 1]);
    expect(list).toEqual([0, 1, 2]);
  });

  it('resposta do motor: posição nova de cada carta da mensagem', () => {
    expect(sortResponseOrder([0, 1, 2])).toEqual([0, 1, 2]);
    // Mostrado: carta 2 no topo, depois 0, depois 1.
    expect(sortResponseOrder([2, 0, 1])).toEqual([1, 2, 0]);
  });

  it('arrasto vira posição pela distância, limitada às pontas', () => {
    expect(dropIndex(0, 10, 100, 3)).toBe(0);
    expect(dropIndex(0, 160, 100, 3)).toBe(2);
    expect(dropIndex(2, -110, 100, 3)).toBe(1);
    expect(dropIndex(1, 900, 100, 3)).toBe(2);
    expect(dropIndex(1, -900, 100, 3)).toBe(0);
  });
});
