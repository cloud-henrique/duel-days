import { useEffect, useRef } from 'react';

export interface TossState {
  what: 'coin' | 'dice';
  /** Quem lançou (0: jogador). */
  p: number;
  /** Moeda: 1 cara, 0 coroa; dado: 1 a 6. */
  results: number[];
  /** Muda a cada lançamento (reinicia a animação). */
  key: number;
  /** Giro e legenda, já com a velocidade; `spin: 0` com "reduzir movimento" (só aparece). */
  spinMs: number;
  captionMs: number;
}

/** Texto do resultado: "Cara"/"Coroa" ou o número do dado. */
export const tossCaption = (t: Pick<TossState, 'what' | 'results'>) =>
  t.results.map((r) => (t.what === 'coin' ? (r ? 'Cara' : 'Coroa') : String(r))).join(' · ');

/** Voltas da moeda (3, mais meia para coroa) e do dado. */
const COIN_TURNS = 3;
const DICE_TURNS = 2;

/**
 * Moeda ou dado no centro: gira e termina no resultado, e então a legenda aparece. Não recebe toques (o toque durante a
 * encenação acelera a fila).
 */
export function Toss({ t, who }: { t: TossState; who: (p: number) => string }) {
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const caption = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const anims = t.results.map((r, i) => {
      const el = items.current[i];
      if (!el || !t.spinMs) return undefined;
      const end = t.what === 'coin' ? `rotateY(${COIN_TURNS * 360 + (r ? 0 : 180)}deg)` : `rotate(${DICE_TURNS * 360}deg)`;
      return el.animate([{ transform: 'none' }, { transform: end }], { duration: t.spinMs, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
    });
    const cap = caption.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.min(200, t.captionMs), delay: t.spinMs, fill: 'both' });
    return () => { anims.forEach((a) => a?.cancel()); cap?.cancel(); };
  }, [t.key]);
  return (
    <div className="toss" aria-live="polite">
      <div className="tossrow">
        {t.results.map((r, i) => (
          <div key={i} ref={(el) => { items.current[i] = el; }} className={t.what === 'coin' ? 'coin' : 'die'}
            style={!t.spinMs && t.what === 'coin' && !r ? { transform: 'rotateY(180deg)' } : undefined}>
            {t.what === 'coin' ? <><b className="heads">Cara</b><b className="tails">Coroa</b></> : <b className="num">{r}</b>}
          </div>
        ))}
      </div>
      <span ref={caption}>{who(t.p)}: {tossCaption(t)}</span>
    </div>
  );
}
