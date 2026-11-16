import type { CSSProperties, Ref } from 'react';
import './titles.css';

export type DisplayTone = 'duel' | 'win' | 'loss' | 'draw';

/**
 * Título de momento do duelo ("DUELO!", "VITÓRIA!", "DERROTA", "EMPATE"), como no nativo: serifada preta e itálica,
 * degradê vertical e brilho na cor do tom. Em tela estreita encolhe em vez de quebrar.
 */
export function DisplayTitle({ tone, children, titleRef, style }: { tone: DisplayTone; children: string; titleRef?: Ref<HTMLHeadingElement>; style?: CSSProperties }) {
  return <h2 ref={titleRef} className={`display-title tone-${tone}`} style={style}>{children}</h2>;
}

/** O nome do jogo em letras metálicas (tela de título): lido como "Duel Days" pelos leitores de tela. */
export function Wordmark({ name = 'Duel Days', shine = false }: { name?: string; shine?: boolean }) {
  return (
    <h1 className={`wordmark${shine ? ' shine' : ''}`} aria-label={name}>
      <span aria-hidden="true" data-text={name.toUpperCase()}>{name.toUpperCase()}</span>
    </h1>
  );
}
