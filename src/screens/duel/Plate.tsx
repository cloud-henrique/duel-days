import { useEffect, useRef, useState } from 'react';
import type { BoardCard } from '../../engine/protocol';
import { art } from '../../components/CardSheet';
import { Ico } from './icons';
import { LP_POPUP_MS, LP_STEPS, LP_STEP_MS, lpDelta, lpPercent, lpTone, lpTween } from './lp';

const BASE = import.meta.env.BASE_URL;
const avatar = (id: string) => `${BASE}characters/${id}/neutral.webp`;

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
 * Placa do duelista: avatar, nome, LP (com variação), barra, contadores e o topo do cemitério. Marca com `data-loc` a
 * placa (`p:plate`, origem e destino das cartas sem lugar visível), o deck e o cemitério, para a animação.
 */
export function Plate({ side, who, lp, deck, hand, grave, turn, onGrave }: { side: 'me' | 'foe'; who: Duelist; lp: number; deck: number; hand: number; grave: BoardCard[]; turn: boolean; onGrave: () => void }) {
  const top = grave[grave.length - 1];
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
        <span className="c-deck" aria-label="Deck" data-loc={`${p}:deck`}>{Ico.deck}{deck}</span>
        {side === 'foe' && <span className="c-hand" aria-label="Mão">{Ico.hand}{hand}</span>}
      </div>
      <button className="gravebox" onClick={onGrave} aria-label="Cemitério" data-loc={`${p}:grave`}>
        <span className={`gslot${top ? '' : ' empty'}`}>{top && <img src={art(top.code, 'small')} alt="" draggable={false} />}</span>
        <em className="num">{grave.length}</em>
      </button>
    </div>
  );
}
