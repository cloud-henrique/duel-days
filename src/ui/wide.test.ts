// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, renderHook } from '@testing-library/react';
import { WIDE_QUERY, useWide } from './wide';

const cssFiles = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? cssFiles(join(dir, e.name)) : e.name.endsWith('.css') ? [join(dir, e.name)] : []);

/** Um `matchMedia` falso cujo resultado o teste troca. */
function fakeMedia(initial: boolean) {
  let on = initial;
  const listeners = new Set<() => void>();
  const mq = { get matches() { return on; }, addEventListener: (_: string, f: () => void) => listeners.add(f), removeEventListener: (_: string, f: () => void) => listeners.delete(f) };
  vi.stubGlobal('matchMedia', vi.fn(() => mq));
  return (v: boolean) => { on = v; listeners.forEach((f) => f()); };
}

afterEach(() => vi.unstubAllGlobals());

describe('tela larga', () => {
  it('useWide acompanha a consulta sem recarregar', () => {
    const set = fakeMedia(true);
    const { result } = renderHook(() => useWide());
    expect(result.current).toBe(true);
    act(() => set(false));
    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith(WIDE_QUERY);
  });

  it('todo @media de tela larga nos CSS usa exatamente o WIDE_QUERY', () => {
    const medias = cssFiles('src').flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/@media\s*([^{]*\b900px[^{]*)\{/g)].map((m) => [f, m[1].trim()]));
    expect(medias.length).toBeGreaterThan(0);
    for (const [f, q] of medias) expect(q, f).toBe(WIDE_QUERY);
  });
});
