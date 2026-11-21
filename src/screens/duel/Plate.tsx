import { useEffect, useRef, useState } from 'react';
import { GameIcon } from '../../ui/icons';
import { LP_POPUP_MS, LP_STEPS, LP_STEP_MS, lpDelta, lpPercent, lpTone, lpTween } from './lp';

const BASE = import.meta.env.BASE_URL;
export const avatar = (id: string) => `${BASE}characters/${id}/neutral.webp`;

export interface Duelist { id: string; name: string }

/** LP mostrado (conta até o valor novo) e a variação recente, visível por LP_POPUP_MS. */
function useLpDisplay(lp: number) {
  const [shown, setShown] = useState(lp);
  const [delta, setDelta] = useState<{ n: number; value: number } | null>(null);
  const prev = useRef(lp);
  useEffect(() => {
    const from = prev.current;
    prev.current = lp;
    if (from === lp) return;
    setDelta((d) => ({ n: (d?.n ?? 0) + 1, value: lp - from }));
    let step = 0;
    const tick = window.setInterval(() => {
      step += 1;
      setShown(lpTween(from, lp, step));
      if (step >= LP_STEPS) window.clearInterval(tick);
    }, LP_STEP_MS);
    const hide = window.setTimeout(() => setDelta(null), LP_POPUP_MS);
    return () => { window.clearInterval(tick); window.clearTimeout(hide); setShown(lp); };
  }, [lp]);
  return { shown, delta };
}

/**
 * Placa do duelista (change tabuleiro-plano): avatar, nome, LP (com variação), barra e a quantidade de cartas na mão.
 * Deck e cemitério ficam na fileira de pilhas. A placa marca com `data-loc` o lugar `p:plate`: alvo do ataque direto e
 * origem/destino das cartas sem lugar visível.
 */
export function Plate({ side, who, lp, hand, turn }: { side: 'me' | 'foe'; who: Duelist; lp: number; hand: number; turn: boolean }) {
  const { shown, delta } = useLpDisplay(lp);
  const p = side === 'me' ? 0 : 1;
  return (
    <div className={`plate hud ${side}${turn ? ' turn' : ''}`} data-loc={`${p}:plate`}>
      <img className="av" src={avatar(who.id)} alt="" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
      <div className="info">
        <div className="nm">{who.name}</div>
        <div className="lpline">
          <span className="lpn num">{shown}</span>
          <span className="lpdelta num">{delta && <b key={delta.n} className={delta.value < 0 ? 'dmg' : 'heal'}>{lpDelta(delta.value)}</b>}</span>
        </div>
        <div className={`bar ${lpTone(lp)}`}><i style={{ width: `${lpPercent(lp)}%` }} /></div>
      </div>
      <div className="counts num">
        <span className="c-hand" aria-label="Mão"><GameIcon name="hand" size={20} />{hand}</span>
      </div>
    </div>
  );
}
