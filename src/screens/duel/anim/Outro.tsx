import { useEffect, useRef, useState } from 'react';
import type { Duelist } from '../Plate';
import { BASE } from '../../../components/art';
import { PACING } from './pacing';
import { Dp } from '../../../ui/Dp';
import { DisplayTitle } from '../../../ui/titles';
import { CardFace } from '../../../components/CardFace';
import { CardZoom } from '../../../components/CardZoom';
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
/**
 * A expressão do oponente no fim: perdeu → raiva ou tristeza; venceu → riso ou deboche (`smug`, quando o personagem
 * tem); empate → surpresa. A sorte só escolhe entre as duas; a primeira que existir no sprite vale (`neutral` no fim).
 */
export function foeExpressions(result: DuelResult, coin: number): string[] {
  if (result === 'win') return coin < 0.5 ? ['angry', 'sad', 'neutral'] : ['sad', 'angry', 'neutral'];
  if (result === 'loss') return coin < 0.5 ? ['laugh', 'happy', 'neutral'] : ['smug', 'laugh', 'neutral'];
  return ['surprised', 'neutral'];
}

export const OUTRO_TITLE: Record<DuelResult, string> = { win: 'VITÓRIA!', loss: 'DERROTA', draw: 'EMPATE' };

/**
 * Fim do duelo: fundo na cor do resultado, o título entrando com escala e o detalhe (ex.: "Você desistiu."); só o
 * rosto do oponente, com a expressão do resultado (bravo ou triste se perdeu, rindo se venceu), dando um pulo; o resumo num painel do HUD
 * (bônus, total em DP, cartas, laço e avisos) e "Continuar".
 */
export function Outro({ result, detail, foe, coins, reward, reduced, onContinue, cards = {} }: {
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
  // Só o rosto do oponente, com a expressão do resultado; sem a face pedida no sprite, cai para a próxima.
  const [exprs] = useState(() => foeExpressions(result, Math.random()));
  const [tryAt, setTryAt] = useState(0);
  const foeTone = result === 'loss' ? 'gold' : result === 'win' ? 'dim' : 'cyan';
  const total = reward?.totalDP ?? coins;
  return (
    <div className={`outro ${result}`}>
      <DisplayTitle tone={result} titleRef={title}>{OUTRO_TITLE[result]}</DisplayTitle>
      {detail && <p className="outrodetail">{detail}</p>}
      <figure className={`outrofoe ${result}`}>
        <Portrait src={`${BASE}characters/${foe.id}/${exprs[tryAt]}.webp`} size={120} tone={foeTone} imgRef={winner}
          onError={tryAt < exprs.length - 1 ? () => setTryAt(tryAt + 1) : undefined} />
        <figcaption>{foe.name}</figcaption>
      </figure>
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
  // Tocar numa carta ganha abre o detalhe (o mesmo zoom do editor de deck), num portal: o painel do resumo é um `.hud`,
  // e o clip-path dele cortaria o zoom.
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="outrodetails">
      {open != null && <CardZoom code={open} cards={cards} onClose={() => setOpen(null)} />}
      {r.cards.length > 0 && (
        <div className="earned">
          {r.cards.map((c, i) => (
            <figure key={`${c.id}-${i}`} className={c.isNew ? 'new' : ''}>
              <button type="button" className="earnedcard" aria-label={`Ver ${cards[String(c.id)]?.name ?? 'carta'}`} onClick={() => setOpen(c.id)}>
                <CardFace code={c.id} card={cards[String(c.id)]} />
              </button>
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
