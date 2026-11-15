import { useState, type ReactNode } from 'react';
import { ArrowsClockwise, Crosshair, Eye, Lightning, Sword, X } from '@phosphor-icons/react';
import type { Cards } from '../data/cards';
import { attrIcon, attrName, formatStat, frameOf, isMonster, propertyIcon, raceIcon, raceName, typeLine } from '../data/labels';

const BASE = import.meta.env.BASE_URL;
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
/** Ícones das ações. Posições (invocar/baixar) são desenhos próprios; o resto é Phosphor, como no nativo. */
export const ICONS = {
  card: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="2" width="12" height="20" rx="2" fill="#fff" /><rect x="8" y="4" width="8" height="10" fill="#0b1c3f" /></svg>,
  set: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="2" y="6" width="20" height="12" rx="2.5" fill="#0b1c3f" stroke="#fff" strokeWidth="2" /><ellipse cx="12" cy="12" rx="6" ry="2.6" fill="none" stroke="#7fc0ff" strokeWidth="1.8" /></svg>,
  spellset: <svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="2" width="12" height="20" rx="2" fill="#0b1c3f" stroke="#fff" strokeWidth="2" /><text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">0</text></svg>,
  bolt: <Lightning {...PH} />,
  swap: <ArrowsClockwise {...PH} />,
  attack: <Sword {...PH} />,
  direct: <Crosshair {...PH} />,
  eye: <Eye {...PH} />,
};

/** Folha de detalhe da carta (arte, dados e texto), com os botões de ação do contexto. Compacta, como no nativo. */
export function CardSheet({ code, cards, actions = [], onClose, aboveHand = false }: { code: number; cards: Cards; actions?: SheetAction[]; onClose: () => void; aboveHand?: boolean }) {
  const c = cards[String(code)];
  const monster = !!c && isMonster(c.type);
  return (
    <div className={`scrim${aboveHand ? ' uphand' : ''}`}>
      <Backdrop onClose={onClose} />
      <div className="sheet hud">
        <div className="cardsheet">
          <img src={art(code, 'large')} alt={c?.name ?? ''} draggable={false} />
          <div className="meta">
            <div className="nm">{c?.name}</div>
            {monster && c.level > 0 && <div className="stars">{Array.from({ length: Math.min(c.level, MAX_STARS) }, (_, i) => <i key={i} />)}</div>}
            {monster
              ? <div className="kv"><CardIcon name={attrIcon(c.attribute)} /><CardIcon name={raceIcon(c.race)} /><span>{attrName(c.attribute)} · {raceName(c.race)}</span></div>
              : c && <div className={`kv kind ${frameOf(c.type)}`}><CardIcon name={propertyIcon(c.type)} /><span>{typeLine(c.type)}</span></div>}
            {monster && <div className="atkdef num"><span className="atk">ATK {formatStat(c.attack)}</span><span className="def">DEF {formatStat(c.defense)}</span></div>}
            <div className="desc">{c?.desc}</div>
          </div>
        </div>
        {actions.length > 0 && <div className="acts">{actions.map((a) => <button key={a.label} className={`hud-btn act ${a.primary ? 'primary' : ''}`} disabled={a.disabled} onClick={a.onClick}>{a.icon}<span>{a.label}</span></button>)}</div>}
        <button className="close" aria-label="Fechar" onClick={onClose}><X size={22} weight="bold" /></button>
      </div>
    </div>
  );
}
