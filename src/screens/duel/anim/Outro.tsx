import { useEffect, useRef } from 'react';
import { avatar, type Duelist } from '../Plate';
import { PACING } from './pacing';
import { Dp } from '../../../ui/Dp';
import { DisplayTitle } from '../../../ui/titles';
import { art } from '../../../components/CardSheet';
import { GameIcon } from '../../../ui/icons';

export type DuelResult = 'win' | 'loss' | 'draw';

/** O que o duelo rendeu (campanha): DP com cada bônus, cartas ganhas, o laço e avisos (pacote ganho, pacote liberado). */
export interface OutroReward {
  baseDP: number;
  bonuses: { label: string; dp: number }[];
  totalDP: number;
  cards: { id: number; isNew: boolean; label?: string }[];
  bond: { before: number; after: number; perHeart: number; note?: string } | null;
  notes: string[];
}
export const OUTRO_TITLE: Record<DuelResult, string> = { win: 'VITÓRIA!', loss: 'DERROTA', draw: 'EMPATE' };

/**
 * Fim do duelo: fundo na cor do resultado, o título entrando com escala, o retrato do vencedor dando um pulo e o do
 * perdedor esmaecido; embaixo, o detalhe (ex.: "Você desistiu."), o ganho em DP e "Continuar".
 */
export function Outro({ result, detail, me, foe, coins, reward, reduced, onContinue }: {
  result: DuelResult; detail: string; me: Duelist; foe: Duelist;
  /** Ganho simples em DP (sem campanha); com `reward`, vale o total dele. */
  coins?: number; reward?: OutroReward | null; reduced: boolean; onContinue: () => void;
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
      <DisplayTitle tone={result} titleRef={title}>{OUTRO_TITLE[result]}</DisplayTitle>
      <div className="outrofaces">{face(me, result === 'win')}{face(foe, result === 'loss')}</div>
      <p className="stats">{detail}{(reward || coins !== undefined) && <> · <Dp value={reward?.totalDP ?? coins ?? 0} delta /></>}</p>
      {reward && <OutroDetails r={reward} />}
      <button className="hud-btn gold" onClick={onContinue}>Continuar</button>
    </div>
  );
}

function OutroDetails({ r }: { r: OutroReward }) {
  const hearts = (v: number, per: number) => (v / per).toFixed(1).replace('.0', '').replace('.', ',');
  return (
    <div className="outrodetails">
      {r.bonuses.length > 0 && (
        <ul className="bonuses">
          <li><span>Vitória</span><Dp value={r.baseDP} /></li>
          {r.bonuses.map((b) => <li key={b.label}><span>{b.label}</span><Dp value={b.dp} delta /></li>)}
        </ul>
      )}
      {r.cards.length > 0 && (
        <div className="earned">
          {r.cards.map((c, i) => (
            <figure key={`${c.id}-${i}`} className={c.isNew ? 'new' : ''}>
              <img src={art(c.id, 'small')} alt="" />
              {c.isNew && <b className="newtag">NOVA</b>}
              {c.label && <figcaption>{c.label}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {r.bond && r.bond.after !== r.bond.before && (
        <p className="bondline"><GameIcon name="heart" size={16} /> Laço <span className="num">{r.bond.after - r.bond.before > 0 ? '+' : ''}{r.bond.after - r.bond.before}</span> ({hearts(r.bond.after, r.bond.perHeart)} corações)</p>
      )}
      {r.bond?.note && <p className="bondline"><GameIcon name="heart" size={16} /> {r.bond.note}</p>}
      {r.notes.map((n) => <p key={n} className="bondline"><GameIcon name="gift" size={16} /> {n}</p>)}
    </div>
  );
}
