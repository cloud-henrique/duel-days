import { useEffect, useRef } from 'react';
import { avatar, type Duelist } from '../Plate';
import { PACING } from './pacing';
import { Dp } from '../../../ui/Dp';
import { DisplayTitle } from '../../../ui/titles';
import { CardFace } from '../../../components/CardFace';
import type { Cards } from '../../../data/cards';
import { GameIcon } from '../../../ui/icons';
import { Portrait } from '../../../ui/Portrait';
import { BondHearts } from '../../../ui/BondHearts';

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
 * Fim do duelo: fundo na cor do resultado, o título entrando com escala e o detalhe (ex.: "Você desistiu."); os dois
 * retratos emoldurados (o do vencedor em dourado, dando um pulo, e o do perdedor esmaecido); o resumo num painel do HUD
 * (bônus, total em DP, cartas, laço e avisos) e "Continuar".
 */
export function Outro({ result, detail, me, foe, coins, reward, reduced, onContinue, cards = {} }: {
  result: DuelResult; detail: string; me: Duelist; foe: Duelist;
  /** Ganho simples em DP (sem campanha); com `reward`, vale o total dele. */
  coins?: number; reward?: OutroReward | null; reduced: boolean; onContinue: () => void;
  /** Banco de cartas, para desenhar as cartas ganhas. */
  cards?: Cards;
}) {
  const P = PACING.outro;
  const title = useRef<HTMLHeadingElement>(null);
  const winner = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduced) return;
    const anims = [
      title.current?.animate([{ transform: 'scale(2.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: P.title, easing: 'cubic-bezier(.2,.8,.3,1.2)', fill: 'both' }),
      winner.current?.animate([{ transform: 'none' }, { transform: `translateY(-${P.jumpPx}px)`, offset: 0.4 }, { transform: 'none' }], { duration: P.jump, delay: P.title, easing: 'ease-out' }),
    ];
    return () => anims.forEach((a) => a?.cancel());
  }, []);
  const face = (d: Duelist, won: boolean) => {
    const lost = !won && result !== 'draw';
    return (
      <figure className={won ? 'won' : lost ? 'lost' : ''}>
        <Portrait src={avatar(d.id)} size={92} tone={won ? 'gold' : lost ? 'dim' : 'cyan'} imgRef={won ? winner : undefined} />
        <figcaption>{d.name}</figcaption>
      </figure>
    );
  };
  const total = reward?.totalDP ?? coins;
  return (
    <div className={`outro ${result}`}>
      <DisplayTitle tone={result} titleRef={title}>{OUTRO_TITLE[result]}</DisplayTitle>
      {detail && <p className="outrodetail">{detail}</p>}
      <div className="outrofaces">{face(me, result === 'win')}<span className="outrovs">VS</span>{face(foe, result === 'loss')}</div>
      {(reward || total !== undefined) && (
        <section className="outrosum hud">
          {reward && reward.bonuses.length > 0 && (
            <ul className="bonuses">
              <li><span>Vitória</span><Dp value={reward.baseDP} /></li>
              {reward.bonuses.map((b) => <li key={b.label}><span>{b.label}</span><Dp value={b.dp} delta /></li>)}
            </ul>
          )}
          {total !== undefined && <p className="outrototal"><span>Total</span><Dp value={total} delta /></p>}
          {reward && <OutroDetails r={reward} cards={cards} />}
        </section>
      )}
      <button className="hud-btn primary wide outrocont" onClick={onContinue}>Continuar</button>
    </div>
  );
}

function OutroDetails({ r, cards }: { r: OutroReward; cards: Cards }) {
  return (
    <div className="outrodetails">
      {r.cards.length > 0 && (
        <div className="earned">
          {r.cards.map((c, i) => (
            <figure key={`${c.id}-${i}`} className={c.isNew ? 'new' : ''}>
              <CardFace code={c.id} card={cards[String(c.id)]} />
              {c.isNew && <b className="newtag">NOVA</b>}
              {c.label && <figcaption>{c.label}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {r.bond && r.bond.after !== r.bond.before && (
        <p className="bondline"><span>Laço <b className="num">{r.bond.after - r.bond.before > 0 ? '+' : ''}{r.bond.after - r.bond.before}</b></span><BondHearts value={r.bond.after / r.bond.perHeart} size={16} /></p>
      )}
      {r.bond?.note && <p className="bondline"><GameIcon name="heart" size={16} /> {r.bond.note}</p>}
      {r.notes.map((n) => <p key={n} className="bondline"><GameIcon name="gift" size={16} /> {n}</p>)}
    </div>
  );
}
