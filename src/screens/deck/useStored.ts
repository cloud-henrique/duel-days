import { useState } from 'react';

/**
 * Um ajuste deste aparelho no `localStorage` (a posição da gaveta, a ordem da maleta): conveniência, não progresso. Lê
 * e grava dentro de try/catch (aba privada, Safari sem armazenamento) e cai no padrão se o valor não servir.
 */
export function useStored<T>(key: string, fallback: T, valid: (v: unknown) => v is T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      const v: unknown = raw == null ? null : JSON.parse(raw);
      return valid(v) ? v : fallback;
    } catch { return fallback; }
  });
  const set = (v: T) => {
    setValue(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* sem armazenamento: só nesta visita */ }
  };
  return [value, set];
}
