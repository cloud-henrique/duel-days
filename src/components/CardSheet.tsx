import type { Cards } from '../data/cards';
import { attrName, isMonster, raceName, typeLine } from '../data/labels';

const BASE = import.meta.env.BASE_URL;
export const art = (code: number, size: 'small' | 'large') => `${BASE}cards/${size}/${code}.webp`;
export interface SheetAction { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }

/** Folha de detalhe da carta (arte, dados e texto), com os botões de ação do contexto. */
export function CardSheet({ code, cards, actions = [], onClose }: { code: number; cards: Cards; actions?: SheetAction[]; onClose: () => void }) {
  const c = cards[String(code)];
  const monster = !!c && isMonster(c.type);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet hud" onClick={(e) => e.stopPropagation()}>
        <div className="cardsheet">
          <img src={art(code, 'large')} alt={c?.name ?? ''} draggable={false} />
          <div className="meta">
            <div className="nm">{c?.name}</div>
            {monster && c.level > 0 && <div className="stars">{'★'.repeat(Math.min(c.level, 12))}</div>}
            <div className="kv">{c && typeLine(c.type)}{monster && ` · ${attrName(c.attribute)} · ${raceName(c.race)}`}</div>
            {monster && <div><span className="atk">ATK {c.attack}</span> &nbsp; <span className="def">DEF {c.defense}</span></div>}
            <div className="desc">{c?.desc}</div>
          </div>
        </div>
        {actions.length > 0 && <div className="acts">{actions.map((a) => <button key={a.label} className={`hud-btn ${a.primary ? 'primary' : ''}`} disabled={a.disabled} onClick={a.onClick}>{a.label}</button>)}</div>}
        <button className="hud-btn close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
