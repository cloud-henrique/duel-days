import type { CSSProperties } from 'react';
import { OcgLocation, OcgPosition } from 'ocgcore-wasm';
import type { BoardCard } from '../../engine/protocol';
import type { Cards } from '../../data/cards';
import { formatStat, isMonster } from '../../data/labels';
import { CardBack, CardFace } from '../../components/CardFace';
import { refKey, type CardRef } from './prompt';
import { locKey, toLoc } from '../../engine/beats';
import { GameIcon } from '../../ui/icons';

const DEFENSE = OcgPosition.FACEUP_DEFENSE | OcgPosition.FACEDOWN_DEFENSE;

export type ZoneKind = 'm' | 's' | 'f';
export type OnTapCard = (code: number, ref: CardRef, hidden: boolean) => void;
/** Destaque de uma carta: `hl` brilha (tem ação ou pode ser escolhida); `picked` já está marcada numa escolha. */
export type Mark = 'hl' | 'picked' | 'rel';
export const markOf = (ref: CardRef, hl: Set<string>, picked?: Set<string>, rel?: Set<string>): Mark | undefined => {
  const k = refKey(ref);
  return picked?.has(k) ? 'picked' : hl.has(k) ? 'hl' : rel?.has(k) ? 'rel' : undefined;
};

/**
 * Selo da carta afetada no campo: equipada, presa por um alvo mantido (ex. Círculo da Profecia) ou tomada do dono.
 * Uma palavra só (a de maior peso); a folha da carta diz qual carta a afeta.
 */
export function tagOf(c: BoardCard): { cls: string; text: string } | null {
  const by = (c.links ?? []).filter((l) => l.dir === 'by');
  if (c.stolen) return { cls: 'stolen', text: 'Tomado' };
  if (by.some((l) => l.kind === 'target')) return { cls: 'target', text: 'Alvo' };
  if (by.some((l) => l.kind === 'equip')) return { cls: 'equip', text: 'Equipado' };
  return null;
}

/** As linhas da folha sobre as ligações da carta: quem a afeta e quem ela afeta. */
export function linkNotes(c: BoardCard | null | undefined, name: (code: number) => string, mine: boolean): string[] {
  if (!c) return [];
  const out: string[] = [];
  if (c.stolen) out.push(mine ? 'Tomado do oponente' : 'Tomado de você');
  for (const l of c.links ?? []) {
    const n = name(l.code);
    if (l.kind === 'equip') out.push(l.dir === 'by' ? `Equipado com ${n}` : `Equipado em ${n}`);
    else out.push(l.dir === 'by' ? `Alvo de ${n}` : `Alvo: ${n}`);
  }
  return out;
}

/** Uma carta (ou zona vazia) no campo ou na mão. */
export function Slot({ c, cards, cref, foe, mark, onTap, style, zone, lift }: {
  c: BoardCard | null; cards: Cards; cref: CardRef; foe?: boolean; mark?: Mark; zone?: ZoneKind;
  onTap: OnTapCard; style?: CSSProperties; lift?: boolean;
}) {
  const loc = locKey(toLoc(cref));
  if (!c) {
    // Zona vazia: o emblema apagado do tipo.
    const emblem = zone ? <GameIcon name={zone === 'm' ? 'monsterZone' : zone === 'f' ? 'fieldZone' : 'spellZone'} /> : null;
    return <div className={`zone empty ${zone ?? 'm'}`} style={style} data-loc={loc}>{emblem}</div>;
  }
  const inHand = cref.location === OcgLocation.HAND;
  const facedown = !inHand && (c.position & OcgPosition.FACEDOWN) !== 0;
  const info = cards[String(c.code)];
  const def = !inHand && (c.position & DEFENSE) !== 0 && !!info && isMonster(info.type);
  const hidden = !!foe && (facedown || inHand);
  const mon = !!info && isMonster(info.type);
  const showStats = !facedown && !inHand && c.attack != null && mon;
  const tag = inHand ? null : tagOf(c);
  const cls = `${zone ? `zone ${zone}` : 'slot'}${def ? ' def' : ''}${facedown ? ' down' : ''}${mark ? ` ${mark}` : ''}${lift ? ' lift' : ''}`;
  return (
    <button className={cls} style={style} data-loc={loc} disabled={hidden && !mark} aria-label={hidden ? 'Carta virada' : info?.name} onClick={() => onTap(c.code, cref, hidden)}>
      {hidden ? <CardBack /> : <CardFace code={c.code} card={info} />}
      {tag && <b className={`tag ${tag.cls}`}>{tag.text}</b>}
      {showStats && <i className="num"><span className="atk">{formatStat(c.attack)}</span>/<span className="def">{formatStat(c.defense)}</span></i>}
    </button>
  );
}
