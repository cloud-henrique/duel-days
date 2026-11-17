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
export const packImage = (key: string) => `${BASE}campaign/pack-${key}.jpg`;
export const faceOf = (duelist: string) => `${BASE}characters/${CHAR_ID[duelist] ?? duelist}/neutral.webp`;
