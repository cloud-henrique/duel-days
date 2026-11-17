import { useState, type ReactNode } from 'react';
import { ArrowsClockwise, CompassRose, Crosshair, Eye, EyeSlash, Link, Sparkle, Sword, Tornado, X } from '@phosphor-icons/react';
import type { Cards } from '../data/cards';
import { attrIcon, attrName, formatStat, frameOf, isMonster, propertyIcon, raceIcon, raceName, typeLine } from '../data/labels';

export const BASE = import.meta.env.BASE_URL;
const MAX_STARS = 12;
export const art = (code: number, size: 'small' | 'large' | 'cropped') => `${BASE}cards/${size}/${code}.webp`;
/**
 * Fundo escurecido que fecha ao tocar. É um <button> porque o Safari do iOS não entrega toques a <div> sem
 * tratamento especial; a folha fica por cima dele.
 */
export function Backdrop({ onClose }: { onClose: () => void }) {
  return <button type="button" className="backdrop" aria-label="Fechar" onClick={onClose} />;
}

export interface SheetAction { label: string; onClick: () => void; primary?: boolean; disabled?: boolean; icon?: ReactNode }

/**
 * Ícone oficial de carta (atributo, tipo de monstro, Magia Rápida) copiado do nativo para `public/card-icons/`
 * (`scripts/copy_card_icons.py`, fora do git). Sem o arquivo, some: o texto ao lado diz a mesma coisa.
 */
export function CardIcon({ name }: { name: string | null }) {
  const [missing, setMissing] = useState(false);
  if (!name || missing) return null;
  return <img className="cardicon" src={`${BASE}card-icons/${name}.svg`} alt="" draggable={false} onError={() => setMissing(true)} />;
}

const PH = { size: 22, weight: 'fill' } as const;
/**
 * Ícones das ações, todos do Phosphor (consistência com o resto da interface). A escolha de cada um seguiu o ícone do
 * Tag Force correspondente: estouro (ativar), redemoinho (invocar); Invocação-Especial e baixar (virada, oculta) escolhidos pelo jogador.
 */
export const ICONS = {
  activate: <Sparkle {...PH} />,
  summon: <Tornado {...PH} />,
  special: <CompassRose {...PH} />,
  set: <EyeSlash {...PH} />,
  swap: <ArrowsClockwise {...PH} />,
  chain: <Link {...PH} />,
  attack: <Sword {...PH} />,
  direct: <Crosshair {...PH} />,
  eye: <Eye {...PH} />,
};

/** Os dados da carta (nome, estrelas, atributo e tipo, ATK/DEF e texto), na folha do duelo e no zoom. */
export function CardDetails({ code, cards }: { code: number; cards: Cards }) {
  const c = cards[String(code)];
  const monster = !!c && isMonster(c.type);
  return (
    <div className="meta">
      <div className="nm">{c?.name}</div>
      {monster && c.level > 0 && <div className="stars">{Array.from({ length: Math.min(c.level, MAX_STARS) }, (_, i) => <i key={i} />)}</div>}
      {monster
        ? <div className="kv"><CardIcon name={attrIcon(c.attribute)} /><CardIcon name={raceIcon(c.race)} /><span>{attrName(c.attribute)} · {raceName(c.race)}</span></div>
        : c && <div className={`kv kind ${frameOf(c.type)}`}><CardIcon name={propertyIcon(c.type)} /><span>{typeLine(c.type)}</span></div>}
      {monster && <div className="atkdef num"><span className="atk">ATK {formatStat(c.attack)}</span><span className="def">DEF {formatStat(c.defense)}</span></div>}
      <div className="desc">{c?.desc}</div>
    </div>
  );
}

/** Folha de detalhe da carta (arte, dados e texto), com os botões de ação do contexto. Compacta, como no nativo. */
export function CardSheet({ code, cards, actions = [], onClose, aboveHand = false }: { code: number; cards: Cards; actions?: SheetAction[]; onClose: () => void; aboveHand?: boolean }) {
  const c = cards[String(code)];
  return (
    <div className={`scrim${aboveHand ? ' uphand' : ''}`}>
      <Backdrop onClose={onClose} />
      <div className="sheet hud">
        <div className="cardsheet">
          <img src={art(code, 'large')} alt={c?.name ?? ''} draggable={false} />
          <CardDetails code={code} cards={cards} />
        </div>
        {actions.length > 0 && <div className="acts">{actions.map((a) => <button key={a.label} className={`hud-btn act ${a.primary ? 'primary' : ''}`} disabled={a.disabled} onClick={a.onClick}>{a.icon}<span>{a.label}</span></button>)}</div>}
        <button className="close" aria-label="Fechar" onClick={onClose}><X size={22} weight="bold" /></button>
      </div>
    </div>
  );
}
