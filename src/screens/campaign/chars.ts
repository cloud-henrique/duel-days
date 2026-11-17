/** Personagens da campanha na PWA: a pasta do sprite do *Duel Links* e as expressões do nativo traduzidas. */
import type { Expression } from '../../campaign/data/types';

export interface CharInfo { id: string; name: string; body: { w: number; h: number }; face: { x: number; y: number; w: number; h: number }; expressions: string[] }

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
};

/** Expressão do nativo → a da PWA; sem par, cai para `neutral`. */
const EXPR: Record<Expression, string[]> = {
  neutral: ['neutral'],
  happy: ['happy', 'laugh'],
  sad: ['sad'],
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
};
export const speakerColor = (key: string) => SPEAKER_COLOR[key] ?? '#2ab8ff';
