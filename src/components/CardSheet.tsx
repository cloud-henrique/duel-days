import type { ReactNode } from 'react';
import type { Cards } from '../data/cards';
import { attrName, isMonster, raceName, typeLine } from '../data/labels';

const BASE = import.meta.env.BASE_URL;
export const art = (code: number, size: 'small' | 'large') => `${BASE}cards/${size}/${code}.webp`;
/**
 * Fundo escurecido que fecha ao tocar. É um <button> porque o Safari do iOS não entrega toques a <div> sem
 * tratamento especial; a folha fica por cima dele.
 */
export function Backdrop({ onClose }: { onClose: () => void }) {
  return <button type="button" className="backdrop" aria-label="Fechar" onClick={onClose} />;
}

export interface SheetAction { label: string; onClick: () => void; primary?: boolean; disabled?: boolean; icon?: ReactNode }

const ATTR_GLYPH: Record<string, [string, string]> = {
  TERRA: ['地', '#8a6a3a'], 'ÁGUA': ['水', '#2f8de0'], FOGO: ['炎', '#e0502f'], VENTO: ['風', '#3cae6a'],
  LUZ: ['光', '#d9b43a'], TREVAS: ['闇', '#7a3fa8'], DIVINO: ['神', '#c9a227'],
};
/** Selo redondo do atributo (kanji sobre cor), como na carta física. */
export function AttrBadge({ attr, size = 26 }: { attr: number; size?: number }) {
  const [g, bg] = ATTR_GLYPH[attrName(attr)] ?? ['?', '#555'];
  return <span className="attrb" style={{ width: size, height: size, background: bg, fontSize: size * 0.62 }}>{g}</span>;
}

/** Ícones das ações (SVG simples, sem material de terceiros). */
export const ICONS = {
  card: <svg viewBox="0 0 24 24" width="26" height="26"><rect x="6" y="2" width="12" height="20" rx="2" fill="#fff" /><rect x="8" y="4" width="8" height="10" fill="#0b1c3f" /></svg>,
  set: <svg viewBox="0 0 24 24" width="26" height="26"><rect x="2" y="6" width="20" height="12" rx="2.5" fill="#0b1c3f" stroke="#fff" strokeWidth="2" /><ellipse cx="12" cy="12" rx="6" ry="2.6" fill="none" stroke="#7fc0ff" strokeWidth="1.8" /></svg>,
  spellset: <svg viewBox="0 0 24 24" width="26" height="26"><rect x="6" y="2" width="12" height="20" rx="2" fill="#0b1c3f" stroke="#fff" strokeWidth="2" /><text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">0</text></svg>,
  bolt: <svg viewBox="0 0 24 24" width="24" height="24"><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="#fff" /></svg>,
  swap: <svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 12a8 8 0 0 1 14-5l2-2v7h-7l2.5-2.5A5 5 0 0 0 7 12zM20 12a8 8 0 0 1-14 5l-2 2v-7h7l-2.5 2.5A5 5 0 0 0 17 12z" fill="#fff" /></svg>,
  sword: <svg viewBox="0 0 24 24" width="24" height="24"><path d="M20 2 9 13l2 2L22 4V2zM8 14l-4 4 2 2 4-4zM3 17l-1 4 4-1z" fill="#fff" /></svg>,
  eye: <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="#fff" /><circle cx="12" cy="12" r="2" fill="#fff" /></svg>,
};

/** Folha de detalhe da carta (arte, dados e texto), com os botões de ação do contexto. */
export function CardSheet({ code, cards, actions = [], onClose, aboveHand = false }: { code: number; cards: Cards; actions?: SheetAction[]; onClose: () => void; aboveHand?: boolean }) {
  const c = cards[String(code)];
  const monster = !!c && isMonster(c.type);
  const race = monster ? raceName(c.race) : '';
  return (
    <div className={`scrim${aboveHand ? ' uphand' : ''}`}>
      <Backdrop onClose={onClose} />
      <div className="sheet hud">
        <div className="cardsheet">
          <img src={art(code, 'large')} alt={c?.name ?? ''} draggable={false} />
          <div className="meta">
            <div className="nm">{c?.name}</div>
            {monster && c.level > 0 && <div className="stars">{Array.from({ length: Math.min(c.level, 12) }, (_, i) => <i key={i} />)}</div>}
            {monster
              ? <div className="kv"><AttrBadge attr={c.attribute} />{attrName(c.attribute)} · {race}</div>
              : <div className="kv">{c && typeLine(c.type)}</div>}
            {monster && <div className="atkdef"><span className="atk">ATK {c.attack}</span><span className="def">DEF {c.defense}</span></div>}
            <div className="desc">{c?.desc}</div>
          </div>
        </div>
        {actions.length > 0 && <div className="acts">{actions.map((a) => <button key={a.label} className={`hud-btn act ${a.primary ? 'primary' : ''}`} disabled={a.disabled} onClick={a.onClick}>{a.icon}<span>{a.label}</span></button>)}</div>}
        <button className="hud-btn close" aria-label="Fechar" onClick={onClose}><svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 5l14 14M19 5 5 19" stroke="#9fd0ff" strokeWidth="3" strokeLinecap="round" /></svg></button>
      </div>
    </div>
  );
}
