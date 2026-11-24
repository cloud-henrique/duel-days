/** Personagens da campanha na PWA: a pasta do sprite do *Duel Links* e as expressões do nativo traduzidas. */
import type { Expression } from '../../campaign/data/types';

export interface CharInfo { id: string; name: string; body: { w: number; h: number; bottom?: number }; face: { x: number; y: number; w: number; h: number }; expressions: string[] }

/** Chave do nativo → pasta em `public/characters`. O vovô fala na loja (falas sem `speaker`). */
export const CHAR_ID: Record<string, string> = {
  tristan: 'tristan_taylor',
  tea: 'tea_gardner',
  joey: 'joey_wheeler',
  bakura: 'bakura',
  yugi: 'yugi_muto',
  solomon: 'solomon_muto',
  // Tier 2 (change `campanha-tiers`)
  weevil: 'weevil_underwood',
  rex: 'rex_raptor',
  mako: 'mako_tsunami',
  keith: 'bandit_keith',
  mai: 'mai_valentine',
  pegasus: 'maximillion_pegasus',
  // Tier 3 (change `tier3-batalha-da-cidade`); o Strings só tem `neutral` e `worried`
  espa: 'espa_roba',
  rarehunter: 'rare_hunter',
  arkana: 'arkana',
  strings: 'strings',
  kaiba: 'seto_kaiba',
  // Tier 4 (change tier4-finais): o Yami Yugi e o Yami Bakura são duelistas à parte do Yugi e do Bakura do Tier 1
  ishizu: 'ishizu_ishtar',
  odion: 'odion',
  yamibakura: 'yami_bakura',
  marik: 'marik_ishtar',
  yamimarik: 'yami_marik',
  yamiyugi: 'yami_yugi',
};

/** Expressão do nativo → a da PWA; sem par, cai para `neutral`. */
const EXPR: Record<Expression, string[]> = {
  neutral: ['neutral'],
  happy: ['happy', 'laugh'],
  sad: ['sad', 'worried'], // o Strings não tem `sad`
  angry: ['angry'],
  surprised: ['surprised'],
  blushing: ['embarrassed'],
};

export function expressionFor(available: string[], e: Expression | string): string {
  for (const x of EXPR[e as Expression] ?? [e]) if (available.includes(x)) return x;
  return 'neutral';
}

/** A cor de quem fala (a do `DuelistStyle` do nativo): o filete da placa do nome e o brilho da caixa de fala. */
export const SPEAKER_COLOR: Record<string, string> = {
  tristan: '#ff9500', tea: '#ff2d55', joey: '#34c759', bakura: '#bfd9ff', yugi: '#af52de', solomon: '#a2845e', player: '#2ab8ff',
  weevil: '#8bc34a', rex: '#e0603a', mako: '#1e88e5', keith: '#b0b7c0', mai: '#c86bd8', pegasus: '#e8d27a',
  espa: '#4dd0e1', rarehunter: '#8d6e63', arkana: '#7e57c2', strings: '#9e9e9e', kaiba: '#5c9cff',
  ishizu: '#f0c75e', odion: '#c08a4a', yamibakura: '#8e9bd8', marik: '#d9a441', yamimarik: '#c2185b', yamiyugi: '#e5484d',
};
export const speakerColor = (key: string) => SPEAKER_COLOR[key] ?? '#2ab8ff';
