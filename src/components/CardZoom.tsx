import type { ReactNode } from 'react';
import type { Cards } from '../data/cards';
import { GameIcon } from '../ui/icons';
import { CardFace } from './CardFace';
import { CardDetails } from './CardSheet';
import './cardzoom.css';

/**
 * A carta ampliada por cima da tela inteira (o `CardZoomView` do nativo, ideia do *Duel Links*): a frente da carta
 * grande, a caixa dos dados com altura fixa (só o texto rola) e, embaixo, o que a tela quiser (`children`: no editor,
 * as cópias e os botões de pôr e tirar). "Fechar" fica no rodapé. Tocar fora, na carta ou nos dados também fecha;
 * os botões de `children` recebem o próprio toque.
 */
export function CardZoom({ code, cards, onClose, children }: { code: number; cards: Cards; onClose: () => void; children?: ReactNode }) {
  const card = cards[String(code)];
  return (
    <div className="cardzoom" role="dialog" aria-modal="true" aria-label={card?.name}>
      {/* <button>: o iOS só entrega toques confiáveis a botões. Cobre a tela; a carta e os dados também fecham. */}
      <button type="button" className="zoom-close-area" aria-label="Fechar" onClick={onClose} />
      <div className="zoom-body">
        <button type="button" className="zoom-card" onClick={onClose} aria-hidden="true" tabIndex={-1}>
          <CardFace code={code} card={card} detail="full" />
        </button>
        <button type="button" className="zoom-info hud cardsheet" onClick={onClose} tabIndex={-1}>
          <CardDetails code={code} cards={cards} />
        </button>
        {children && <div className="zoom-acc">{children}</div>}
      </div>
      <div className="zoom-foot">
        <button className="hud-btn secondary" onClick={onClose}><GameIcon name="close" size={18} /> Fechar</button>
      </div>
    </div>
  );
}
