/**
 * Sorteios reproduzíveis da campanha. Tudo o que é aleatório (quem aparece, falas, tema ruim, cartas) sai de
 * `generator(PURPOSE.x, semente, dia, ...)`: o mesmo estado dá sempre o mesmo resultado, ao reabrir o app e nos testes.
 * Não reproduz os números do nativo (lá é SplitMix64 com UInt64); só a ideia.
 */

/** Para que serve o sorteio: entra na mistura para dois sorteios do mesmo dia não saírem iguais. */
export const PURPOSE = { opponents: 1, dialogue: 2, conversation: 3, cardDrop: 4, pack: 5, friends: 6, mapPoints: 7 } as const;

/** Mistura de inteiros num hash de 32 bits (finalizador do Murmur3 a cada parte). */
export function mix(...parts: number[]): number {
  let h = 0x9e3779b9;
  for (const p of parts) {
    let k = Math.imul(p >>> 0, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    h ^= Math.imul(k, 0x1b873593);
    h = (h << 13) | (h >>> 19);
    h = (Math.imul(h, 5) + 0xe6546b64) | 0;
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export type Rng = () => number;

/** Gerador (mulberry32) a partir da mistura das partes; devolve números em [0, 1). */
export function generator(...parts: number[]): Rng {
  let a = mix(...parts);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (g: Rng, n: number) => Math.floor(g() * n);
export const pick = <T>(g: Rng, list: readonly T[]): T | undefined => (list.length ? list[randInt(g, list.length)] : undefined);

/** Fisher–Yates numa cópia. */
export function shuffle<T>(list: readonly T[], g: Rng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(g, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Semente nova para uma campanha. */
export const newSeed = (): number => {
  const c = globalThis.crypto;
  return c?.getRandomValues ? c.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 2 ** 32);
};
