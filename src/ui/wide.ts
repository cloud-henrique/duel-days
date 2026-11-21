import { useEffect, useState } from 'react';

/**
 * Tela larga (change layout-desktop): paisagem com pelo menos 900×600 (desktop e tablet deitado). O celular deitado
 * (~390 de altura) fica no retrato. Única fonte do critério: os `@media` de tela larga dos CSS usam esta mesma string
 * (`wide.test.ts` confere) e o React lê pelo `useWide`.
 */
export const WIDE_QUERY = '(orientation: landscape) and (min-width: 900px) and (min-height: 600px)';
/** Mouse ou trackpad: só com ele existe hover (iPad com dedo não tem). */
export const HOVER_QUERY = '(hover: hover) and (pointer: fine)';

function matches(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/** Acompanha uma media query; sem `matchMedia` (testes em node), falso. */
export function useMedia(query: string): boolean {
  const [on, setOn] = useState(() => matches(query));
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const update = () => setOn(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return on;
}

/** Se a tela é larga agora (troca ao girar ou redimensionar, sem recarregar). */
export const useWide = () => useMedia(WIDE_QUERY);
/** Se há ponteiro fino com hover. */
export const useHover = () => useMedia(HOVER_QUERY);
