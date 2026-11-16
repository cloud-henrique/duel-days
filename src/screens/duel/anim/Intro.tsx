import { useEffect, useRef } from 'react';
import type { Settings } from '../../../story/progress';
import { avatar, type Duelist } from '../Plate';
import { PACING } from './pacing';
import { Coin } from '../../../ui/coin';
import { DisplayTitle } from '../../../ui/titles';

/** A abertura só aparece com animações (com "desligada", o duelo começa direto). */
export const wantsIntro = (anim: Settings['anim']) => anim !== 'off';

/** Instantes da abertura (ms): fim da moeda, entrada das faixas, "DUELO!", início do fade e fim. */
export function introTimeline(reduced: boolean) {
  const P = PACING.intro;
  // Com "reduzir movimento", sem giro nem escala: a moeda e as faixas só aparecem.
  const coin = reduced ? 0 : P.coin;
  const banners = coin + P.starter;
  const title = banners + P.banners;
  const fade = title + P.title + P.hold;
  return { coin, banners, title, fade, end: fade + P.fade };
}

/**
 * Abertura do duelo: a moeda decide quem começa, as faixas dos dois duelistas entram pelos lados e "DUELO!" aparece.
 * Um toque em qualquer lugar pula (é um botão, porque o iOS só entrega toques confiáveis a `<button>`).
 */
export function Intro({ me, foe, starter, reduced, onDone }: { me: Duelist; foe: Duelist; starter: 0 | 1; reduced: boolean; onDone: () => void }) {
  const t = introTimeline(reduced);
  const P = PACING.intro;
  const root = useRef<HTMLButtonElement>(null);
  const caption = useRef<HTMLSpanElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onDone(); } };
  useEffect(() => {
    const fill = 'both' as const;
    const anims = [
      // Cara (0°) para o jogador, coroa (180°) para o oponente.
      caption.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: t.coin, fill }),
      left.current?.animate(reduced ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'translateX(-110%)' }, { transform: 'translateX(4%)', offset: 0.7 }, { transform: 'none' }], { duration: P.banners, delay: t.banners, easing: 'ease-out', fill }),
      right.current?.animate(reduced ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'translateX(110%)' }, { transform: 'translateX(-4%)', offset: 0.7 }, { transform: 'none' }], { duration: P.banners, delay: t.banners, easing: 'ease-out', fill }),
      title.current?.animate(reduced ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'scale(3)', opacity: 0 }, { transform: 'scale(.9)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: P.title, delay: t.title, easing: 'ease-out', fill }),
      root.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: P.fade, delay: t.fade, fill }),
    ];
    const id = window.setTimeout(finish, t.end);
    return () => { window.clearTimeout(id); anims.forEach((a) => a?.cancel()); };
  }, []);
  return (
    <button ref={root} className="intro" aria-label="Pular abertura" onClick={finish}>
      <Coin side={starter === 0 ? 'heads' : 'tails'} spinMs={P.coin} reduced={reduced} size={76} />
      <span ref={caption} className="introstarter">{starter === 0 ? `${me.name} começa` : `${foe.name} começa`}</span>
      <div className="introbanners">
        <div ref={left} className="banner me"><img src={avatar(me.id)} alt="" /><b>{me.name}</b></div>
        <div ref={right} className="banner foe"><b>{foe.name}</b><img src={avatar(foe.id)} alt="" /></div>
      </div>
      <DisplayTitle tone="duel" titleRef={title}>DUELO!</DisplayTitle>
    </button>
  );
}
