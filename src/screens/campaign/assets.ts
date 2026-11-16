/**
 * Arte da campanha (Konami, fora do git: `scripts/copy_campaign_assets.py`). Cada fundo leva um degradê embaixo, que
 * aparece quando o arquivo falta.
 */
import type { PeriodKey } from '../../campaign/state';
import { CHAR_ID } from './chars';

const BASE = import.meta.env.BASE_URL;

const PLACE_FALLBACK: Record<string, string> = {
  escola: 'linear-gradient(180deg,#2f4f8a,#0f2350 55%,#050c1f)',
  burger: 'linear-gradient(180deg,#8a4b2f,#3d1d12 55%,#140806)',
  fliperama: 'linear-gradient(180deg,#4b2f8a,#1d1240 55%,#08051f)',
  parque: 'linear-gradient(180deg,#2f7a4b,#123d22 55%,#05140a)',
  'kame-game': 'linear-gradient(180deg,#7a5a2f,#3a2a12 55%,#140f05)',
};

/** `background-image` do lugar: a imagem e o degradê de reserva. */
export const placeBg = (location: string) =>
  `url(${BASE}campaign/place-${location}.jpg), ${PLACE_FALLBACK[location] ?? PLACE_FALLBACK.escola}`;

export const mapImage = (period: PeriodKey) => `${BASE}campaign/map-${period}.jpg`;
export const packImage = (key: string) => `${BASE}campaign/pack-${key}.jpg`;
export const faceOf = (duelist: string) => `${BASE}characters/${CHAR_ID[duelist] ?? duelist}/neutral.webp`;
