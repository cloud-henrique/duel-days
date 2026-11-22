// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { CARD_SIZE_KEY, DEFAULT_CARD_SIZE, nextCardSize, useCardSize } from './cardSize';

afterEach(() => localStorage.clear());

describe('tamanho das cartas', () => {
  it('M por padrão; troca e fica lembrado no aparelho', () => {
    const { result } = renderHook(() => useCardSize());
    expect(result.current[0]).toBe(DEFAULT_CARD_SIZE);
    expect(DEFAULT_CARD_SIZE).toBe('M');
    act(() => result.current[1]('G'));
    expect(result.current[0]).toBe('G');
    expect(JSON.parse(localStorage.getItem(CARD_SIZE_KEY)!)).toBe('G');
    expect(renderHook(() => useCardSize()).result.current[0]).toBe('G');
  });

  it('valor inválido no aparelho vira M; o ciclo é P → M → G → P', () => {
    localStorage.setItem(CARD_SIZE_KEY, '"XL"');
    expect(renderHook(() => useCardSize()).result.current[0]).toBe('M');
    expect(['P', 'M', 'G'].map((s) => nextCardSize(s as 'P'))).toEqual(['M', 'G', 'P']);
  });
});
