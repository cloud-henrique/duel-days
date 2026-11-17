import { useEffect, useState } from 'react';
import type { CardRecord } from '../engine/session';
import { attrGlyph, faceIcon, formatStat, frameOf, isMonster, raceName, typeLine } from '../data/labels';
import { BASE, art, type ArtSize } from './art';
import './cardface.css';

/**
 * Frente da carta desenhada pelo app (CardFace.swift do nativo): moldura pela cor do tipo, nome em português, estrelas,
 * ilustração recortada e caixa de texto. As medidas ficam no CSS, numa carta de referência de 320 de largura, e escalam
 * com a largura real do elemento (unidades de contêiner).
 *
 * `compact` (mão, campo): a caixa de texto mostra grande "ATK / DEF" ou MAGIA/ARMADILHA.
 * `full` (zoom, destaque da ativação): linha do tipo, texto e "ATK/… DEF/…".
 * A arte é a `thumb` no `compact` e a `full` no `full` (ou a de `artSize`). Sem a arte (offline fora do cache, arquivo
 * faltando), a face continua inteira com um preenchimento na cor da moldura, e tenta de novo ao remontar ou ao voltar
 * a rede (evento `online`).
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

export function CardFace({ code, card, detail = 'compact', artSize }: { code: number; card: CardRecord | undefined; detail?: 'compact' | 'full'; artSize?: ArtSize }) {
  const [artFailed, setArtFailed] = useState(false);
  const [iconMissing, setIconMissing] = useState(false);
  useEffect(() => setArtFailed(false), [code]);
  useEffect(() => {
    if (!artFailed) return;
    const retry = () => setArtFailed(false);
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [artFailed]);
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
      <div className={`cf-art${artFailed ? ' empty' : ''}`}>
        {!artFailed && <img src={art(code, artSize ?? (detail === 'full' ? 'full' : 'thumb'))} alt="" decoding="async" draggable={false} onError={() => setArtFailed(true)} />}
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
