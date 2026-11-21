import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { Cards } from '../../data/cards';
import { formatStat, isMonster } from '../../data/labels';
import { CardInfo, type SheetAction } from '../../components/CardSheet';
import { CardFace } from '../../components/CardFace';
import { actionsPos } from './wide';

/** Linhas que começam assim são separadores (troca de turno) no histórico. */
const SEPARATOR = '—';
/** Quantas linhas do histórico a coluna esquerda mostra. */
const RECENT = 12;
/** Folga entre a carta e a fileira de ações (px). */
const GAP = 8;

/**
 * Painel fixo da carta na coluna direita (tela larga): a carta em foco (sob o ponteiro ou fixada), sem véu. Com um
 * pedido do duelo aberto, vira uma faixa compacta (`compact`) acima dele. Sem carta, uma dica.
 */
export function CardPanel({ code, cards, notes, compact, hover }: { code: number | null; cards: Cards; notes: string[]; compact?: boolean; hover: boolean }) {
  if (code === null) {
    if (compact) return null;
    return <div className="cardpanel hud empty"><p>{hover ? 'Passe o mouse numa carta para ver os detalhes; clique para agir com ela.' : 'Toque numa carta para ver os detalhes.'}</p></div>;
  }
  if (compact) {
    const c = cards[String(code)];
    return (
      <div className="cardpanel hud compact">
        <span className="cpface"><CardFace code={code} card={c} /></span>
        <span className="cptext">
          <b>{c?.name}</b>
          {c && isMonster(c.type) && <span className="num"><span className="atk">ATK {formatStat(c.attack)}</span> <span className="def">DEF {formatStat(c.defense)}</span></span>}
        </span>
      </div>
    );
  }
  return <div className="cardpanel hud"><CardInfo code={code} cards={cards} notes={notes} vertical /></div>;
}

/** As últimas linhas do histórico, a mais nova embaixo (coluna esquerda da tela larga). Clicar abre o histórico todo. */
export function RecentLog({ log, onOpen }: { log: string[]; onOpen: () => void }) {
  const lines = log.slice(-RECENT);
  return (
    <button type="button" className="recentlog" aria-label="Histórico" onClick={onOpen}>
      {lines.map((l, i) => <span key={log.length - lines.length + i} className={l.startsWith(SEPARATOR) ? 'sep' : undefined}>{l}</span>)}
    </button>
  );
}

/**
 * A fileira de ações da carta fixada, logo acima dela (abaixo, sem espaço). Mede o elemento da carta (`data-loc`) na
 * tela de duelo e acompanha: mede de novo quando o tabuleiro muda (`watch`), ao redimensionar e no fim das transições
 * (a carta da mão sobe). Se a carta some da tela, chama `onLost`.
 */
export function CardActions({ root, loc, actions, watch, onLost }: { root: RefObject<HTMLElement | null>; loc: string; actions: SheetAction[]; watch: unknown; onLost: () => void }) {
  const self = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean } | null>(null);
  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;
    const place = () => {
      const el = host.querySelector(`[data-loc="${loc}"]`);
      const me = self.current;
      if (!el) { onLost(); return; }
      if (!me) return;
      const a = host.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setPos(actionsPos({ left: r.left - a.left, top: r.top - a.top, width: r.width, height: r.height }, me.offsetWidth, me.offsetHeight, a, GAP));
    };
    place();
    window.addEventListener('resize', place);
    host.addEventListener('transitionend', place);
    return () => { window.removeEventListener('resize', place); host.removeEventListener('transitionend', place); };
  }, [loc, watch, actions.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={self} className={`cardacts${pos?.below ? ' below' : ''}`} style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}>
      {actions.map((a) => <button key={a.label} className={`hud-btn act${a.primary ? ' primary' : ''}`} disabled={a.disabled} onClick={a.onClick}>{a.icon}<span>{a.label}</span></button>)}
    </div>
  );
}
