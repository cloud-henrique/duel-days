import type { CSSProperties } from 'react';
import { OcgLocation, OcgPosition } from 'ocgcore-wasm';
import type { BoardCard } from '../../engine/protocol';
import type { Cards } from '../../data/cards';
import { formatStat, isMonster } from '../../data/labels';
import { CardBack, CardFace } from '../../components/CardFace';
import type { CardRef } from './prompt';

const DEFENSE = OcgPosition.FACEUP_DEFENSE | OcgPosition.FACEDOWN_DEFENSE;

export type ZoneKind = 'm' | 's' | 'f';
export type OnTapCard = (code: number, ref: CardRef, hidden: boolean) => void;

/** Uma carta (ou zona vazia) no campo ou na mão. */
export function Slot({ c, cards, cref, foe, hl, onTap, style, zone, lift }: {
  c: BoardCard | null; cards: Cards; cref: CardRef; foe?: boolean; hl?: boolean; zone?: ZoneKind;
  onTap: OnTapCard; style?: CSSProperties; lift?: boolean;
}) {
  if (!c) return <div className={`zone empty ${zone ?? 'm'}`} style={style} />;
  const inHand = cref.location === OcgLocation.HAND;
  const facedown = !inHand && (c.position & OcgPosition.FACEDOWN) !== 0;
  const info = cards[String(c.code)];
  const def = !inHand && (c.position & DEFENSE) !== 0 && !!info && isMonster(info.type);
  const hidden = !!foe && (facedown || inHand);
  const mon = !!info && isMonster(info.type);
  const showStats = !facedown && !inHand && c.attack != null && mon;
  const cls = `${zone ? `zone ${zone}` : 'slot'}${def ? ' def' : ''}${facedown ? ' down' : ''}${hl ? ' hl' : ''}${lift ? ' lift' : ''}`;
  return (
    <button className={cls} style={style} disabled={hidden} aria-label={hidden ? 'Carta virada' : info?.name} onClick={() => onTap(c.code, cref, hidden)}>
      {hidden ? <CardBack /> : <CardFace code={c.code} card={info} />}
      {showStats && <i className="num"><span className="atk">{formatStat(c.attack)}</span>/<span className="def">{formatStat(c.defense)}</span></i>}
    </button>
  );
}
