/**
 * Arte da campanha (Konami, fora do git: `scripts/copy_campaign_assets.py` e `scripts/copy_tfs_backgrounds.py`). Cada
 * fundo leva um degradê embaixo, que aparece quando o arquivo falta.
 */
import type { PeriodKey } from '../../campaign/state';
import { CHAR_ID } from './chars';

const BASE = import.meta.env.BASE_URL;

/** Degradê de reserva da cena, pelo tom do fundo (sem o arquivo, a cena fica só com ele). */
const SCENE_FALLBACK = 'linear-gradient(180deg,#2f4f8a,#0f2350 55%,#050c1f)';

/** `background-image` da cena do duelista (fundo do Tag Force Special) com o degradê de reserva. */
export const sceneBg = (bg: string) => `url(${BASE}campaign/bg-${bg}.jpg), ${SCENE_FALLBACK}`;

export const mapImage = (period: PeriodKey) => `${BASE}campaign/map-${period}.jpg`;

/**
 * O mapa de Domino é o único do jogo: os três tons (manhã, tarde, noite) vão na pré-carga do PWA e são decodificados
 * logo ao abrir o app (`preloadMap`), para a tela da campanha não aparecer sem ele. Resolve `true` se carregou.
 */
const mapLoads = new Map<string, Promise<boolean>>();
const mapDone = new Map<string, boolean>();
/** Já decodificado (ou já falhou): a tela pode desenhar o mapa direto, sem esperar nem animar a entrada. */
export const mapSettled = (period: PeriodKey) => mapDone.get(mapImage(period));
export function preloadMap(period: PeriodKey): Promise<boolean> {
  const src = mapImage(period);
  let p = mapLoads.get(src);
  if (!p) {
    p = new Promise<boolean>((resolve) => {
      if (typeof Image === 'undefined') { resolve(false); return; }
      const img = new Image();
      img.onload = () => { (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => { mapDone.set(src, true); resolve(true); }); };
      img.onerror = () => { mapDone.set(src, false); resolve(false); };
      img.src = src;
    });
    mapLoads.set(src, p);
  }
  return p;
}
/** Os três tons, o do período atual primeiro. */
export function preloadMaps(first: PeriodKey) {
  void preloadMap(first).then(() => (['morning', 'afternoon', 'evening'] as PeriodKey[]).forEach((k) => void preloadMap(k)));
}
export const packImage = (key: string) => `${BASE}campaign/pack-${key}.jpg`;
export const faceOf = (duelist: string) => `${BASE}characters/${CHAR_ID[duelist] ?? duelist}/neutral.webp`;
