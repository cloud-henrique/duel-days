export const BASE = import.meta.env.BASE_URL;
/** Ilustração recortada da carta: `thumb` (200 px) para grades, mão, campo e listas; `full` (512 px) para o zoom. */
export type ArtSize = 'thumb' | 'full';
export const art = (code: number, size: ArtSize) => `${BASE}cards/${size}/${code}.webp`;
