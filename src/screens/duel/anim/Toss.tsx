import { useEffect, useRef } from 'react';
import { Coin, Die } from '../../../ui/coin';

export interface TossState {
  what: 'coin' | 'dice';
  /** Quem lançou (0: jogador). */
  p: number;
  /** Moeda: 1 cara, 0 coroa; dado: 1 a 6. */
  results: number[];
  /** O lado que o jogador escolheu antes do lance (cara ou coroa), se houve. */
  call?: 'heads' | 'tails';
  /** Muda a cada lançamento (reinicia a animação). */
  key: number;
  /** Giro e legenda, já com a velocidade; `spin: 0` com "reduzir movimento" (só aparece). */
  spinMs: number;
  captionMs: number;
}

/** Texto do resultado: "Cara"/"Coroa" ou o número do dado. */
export const tossCaption = (t: Pick<TossState, 'what' | 'results'>) =>
  t.results.map((r) => (t.what === 'coin' ? (r ? 'Cara' : 'Coroa') : String(r))).join(' · ');

/** Texto acima da moeda (a escolha do jogador, se houve) e abaixo dela, depois que para (acerto ou o resultado). */
export function tossTexts(t: Pick<TossState, 'what' | 'results' | 'call' | 'p'>, who: (p: number) => string): { above: string | null; below: string } {
  if (t.what === 'coin' && t.call) {
    const landed = t.results[0] === 1 ? 'heads' : 'tails';
    return { above: `Você disse ${t.call === 'heads' ? 'cara' : 'coroa'}`, below: landed === t.call ? 'Acertou!' : 'Errou!' };
  }
  return { above: null, below: `${who(t.p)}: ${tossCaption(t)}` };
}

/**
 * Moeda ou dado desenhados no centro: giram e param no resultado, e então o texto aparece. Com a escolha do jogador
 * (cara ou coroa), ela aparece acima da moeda e o acerto, embaixo. Não recebe toques (o toque durante a encenação
 * acelera a fila).
 */
export function Toss({ t, who }: { t: TossState; who: (p: number) => string }) {
  const caption = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const cap = caption.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.min(200, t.captionMs), delay: t.spinMs, fill: 'both' });
    return () => { cap?.cancel(); };
  }, [t.key]);
  const { above, below } = tossTexts(t, who);
  return (
    <div className="toss" aria-live="polite">
      {above && <span className="tosscall game-title">{above}</span>}
      <div className="tossrow">
        {t.results.map((r, i) => t.what === 'coin'
          ? <Coin key={i} side={r ? 'heads' : 'tails'} spinMs={t.spinMs} spinKey={t.key} />
          : <Die key={i} value={r} spinMs={t.spinMs} spinKey={t.key} />)}
      </div>
      <span ref={caption} className={t.call ? 'tossresult game-title' : undefined}>{below}</span>
    </div>
  );
}
