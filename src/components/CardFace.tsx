import { useState } from 'react';
import type { CardRecord } from '../engine/session';
import { attrGlyph, faceIcon, formatStat, frameOf, isMonster, raceName, typeLine } from '../data/labels';
import { BASE, art } from './CardSheet';
import './cardface.css';

/**
 * Frente da carta desenhada pelo app (CardFace.swift do nativo): moldura pela cor do tipo, nome em português, estrelas,
 * ilustração recortada e caixa de texto. As medidas ficam no CSS, numa carta de referência de 320 de largura, e escalam
 * com a largura real do elemento (unidades de contêiner).
 *
 * `compact` (mão, campo): a caixa de texto mostra grande "ATK / DEF" ou MAGIA/ARMADILHA.
 * `full` (destaque da ativação): linha do tipo, texto e "ATK/… DEF/…".
 */

/** O nome cabe em uma linha: a fonte diminui com o número de letras, entre estes limites (em unidades da carta). */
const NAME_FONT_MAX = 24;
const NAME_FONT_MIN = 12;
/** Largura útil da faixa do nome (descontado o selo) e largura média de uma letra versalete serifada (em em). */
const NAME_BOX = 242;
const CHAR_EM = 0.56;
const MAX_STARS = 12;

/** Tamanho da fonte do nome, em unidades da carta de 320: encolhe nomes longos até o mínimo (depois, reticências). */
export function nameFontSize(name: string): number {
  return Math.max(NAME_FONT_MIN, Math.min(NAME_FONT_MAX, NAME_BOX / (CHAR_EM * Math.max(1, name.length))));
}

export function CardFace({ code, card, detail = 'compact' }: { code: number; card: CardRecord | undefined; detail?: 'compact' | 'full' }) {
  const [cropped, setCropped] = useState(true);
  const [iconMissing, setIconMissing] = useState(false);
  if (!card) return <div className="cardface cf-token" />;
  const frame = frameOf(card.type);
  const monster = isMonster(card.type);
  const [glyph, glyphBg] = attrGlyph(card.type, card.attribute);
  const icon = iconMissing ? null : faceIcon(card.type, card.attribute);
  const kind = frame === 'spell' ? 'MAGIA' : frame === 'trap' ? 'ARMADILHA' : null;
  const stats = `${formatStat(card.attack)} / ${formatStat(card.defense)}`;
  return (
    <div className={`cardface cf-${frame} ${detail}`}>
      <div className="cf-frame" />
      <div className="cf-name" style={{ ['--name-size' as string]: nameFontSize(card.name) }}>
        <span>{card.name}</span>
        {/* Ícone oficial; sem ele (não versionado), o selo desenhado com o kanji. */}
        {icon
          ? <img className="cf-attr img" src={`${BASE}card-icons/${icon}.svg`} alt="" draggable={false} onError={() => setIconMissing(true)} />
          : <i className="cf-attr" style={{ background: glyphBg }}>{glyph}</i>}
      </div>
      <div className="cf-level">
        {monster ? Array.from({ length: Math.min(card.level, MAX_STARS) }, (_, i) => <i key={i} />) : <span>[{kind}]</span>}
      </div>
      <div className="cf-art">
        <img src={art(code, cropped ? 'cropped' : 'small')} alt="" draggable={false} className={cropped ? '' : 'whole'} onError={() => setCropped(false)} />
      </div>
      <div className="cf-text">
        {detail === 'compact'
          ? <b className={monster ? 'cf-stats' : 'cf-kind'}>{monster ? stats : kind}</b>
          : <>
            {monster && <em>[{raceName(card.race)}/{typeLine(card.type).replace('Monstro · ', '')}]</em>}
            <p>{card.desc}</p>
            {monster && <small>ATK/{formatStat(card.attack)} DEF/{formatStat(card.defense)}</small>}
          </>}
      </div>
    </div>
  );
}

/** Verso da carta (imagem oficial, não versionada). */
export function CardBack() {
  return <img className="cardback-img" src={`${import.meta.env.BASE_URL}cards/back.webp`} alt="" draggable={false} />;
}
