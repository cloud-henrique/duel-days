import { useEffect, useRef } from 'react';
import type { Cards } from '../../../data/cards';
import { frameOf, type Frame } from '../../../data/labels';
import { CardFace } from '../../../components/CardFace';

/** Cor do halo pelo tipo da carta (as molduras do Manual: Magia verde, Armadilha magenta…). */
export const HALO: Record<Frame, string> = {
  spell: '#1fbf8f', trap: '#d6409f', effect: '#ff8a3d', normal: '#ffd34d', fusion: '#a066ff', ritual: '#4d9dff', token: '#b8c2d6',
};

export interface SplashState {
  code: number;
  /** Quem ativou (0: jogador). */
  p: number;
  /** Muda a cada ativação (reinicia a animação). */
  key: number;
  /** Duração total, já com a velocidade. */
  ms: number;
  /** Escala inicial (1 com "reduzir movimento"). */
  scaleFrom: number;
}

/**
 * Destaque de ativação: a carta grande no centro, com halo na cor do tipo, entrando com escala (mola) e saindo com fade.
 * Não recebe toques (o toque durante a encenação acelera a fila).
 */
export function Splash({ s, cards, who }: { s: SplashState; cards: Cards; who: (p: number) => string }) {
  const card = cards[String(s.code)];
  const halo = HALO[card ? frameOf(card.type) : 'effect'];
  const box = useRef<HTMLDivElement>(null);
  const face = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const anims = [
      box.current?.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: s.ms, fill: 'both' }),
      face.current?.animate(
        [{ transform: `scale(${s.scaleFrom})` }, { transform: 'scale(1.04)', offset: 0.22 }, { transform: 'scale(1)', offset: 0.32 }, { transform: 'scale(1)' }],
        { duration: s.ms, easing: 'ease-out', fill: 'both' },
      ),
    ];
    return () => anims.forEach((a) => a?.cancel());
  }, [s.key]);
  return (
    <div ref={box} className="splash" style={{ ['--halo' as string]: halo }} aria-live="polite">
      <div ref={face} className="splashcard"><CardFace code={s.code} card={card} detail="full" /></div>
      <span>{who(s.p)} ativou {card?.name ?? `#${s.code}`}</span>
    </div>
  );
}
