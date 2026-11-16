import { useEffect, useRef } from 'react';
import { avatar, type Duelist } from '../Plate';
import { PACING } from './pacing';

export type DuelResult = 'win' | 'loss' | 'draw';
export const OUTRO_TITLE: Record<DuelResult, string> = { win: 'VITÓRIA!', loss: 'DERROTA', draw: 'EMPATE' };

/**
 * Fim do duelo: fundo na cor do resultado, o título entrando com escala, o retrato do vencedor dando um pulo e o do
 * perdedor esmaecido; embaixo, o detalhe (ex.: "Você desistiu."), as moedas e "Continuar".
 */
export function Outro({ result, detail, me, foe, coins, reduced, onContinue }: {
  result: DuelResult; detail: string; me: Duelist; foe: Duelist; coins: number; reduced: boolean; onContinue: () => void;
}) {
  const P = PACING.outro;
  const title = useRef<HTMLHeadingElement>(null);
  const winner = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (reduced) return;
    const anims = [
      title.current?.animate([{ transform: 'scale(2.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: P.title, easing: 'cubic-bezier(.2,.8,.3,1.2)', fill: 'both' }),
      winner.current?.animate([{ transform: 'none' }, { transform: `translateY(-${P.jumpPx}px)`, offset: 0.4 }, { transform: 'none' }], { duration: P.jump, delay: P.title, easing: 'ease-out' }),
    ];
    return () => anims.forEach((a) => a?.cancel());
  }, []);
  const face = (d: Duelist, won: boolean) => (
    <figure className={won ? 'won' : result === 'draw' ? '' : 'lost'}>
      <img ref={won ? winner : undefined} src={avatar(d.id)} alt="" />
      <figcaption>{d.name}</figcaption>
    </figure>
  );
  return (
    <div className={`outro ${result}`}>
      <h2 ref={title}>{OUTRO_TITLE[result]}</h2>
      <div className="outrofaces">{face(me, result === 'win')}{face(foe, result === 'loss')}</div>
      <p className="stats">{detail} · +{coins} moedas</p>
      <button className="hud-btn gold" onClick={onContinue}>Continuar</button>
    </div>
  );
}
