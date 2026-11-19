import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Cards } from '../data/cards';
import { GameIcon } from '../ui/icons';
import { CardFace } from './CardFace';
import { CardDetails } from './CardSheet';
import './cardzoom.css';

/**
 * A carta ampliada por cima da tela inteira (o `CardZoomView` do nativo, ideia do *Duel Links*): a frente da carta
 * grande, a caixa dos dados com altura fixa (só o texto rola) e, embaixo, o que a tela quiser (`children`: no editor,
 * as cópias e os botões de pôr e tirar). "Fechar" fica no rodapé. Tocar fora ou na carta também fecha (os dados, não: ali o dedo rola o texto);
 * os botões de `children` recebem o próprio toque.
 */
export function CardZoom({ code, cards, onClose, children }: { code: number; cards: Cards; onClose: () => void; children?: ReactNode }) {
  const card = cards[String(code)];
  // Portal no <body>: dentro de uma tela fixa com animação (a abertura de pacote), o `fixed` ficava preso a ela e o
  // rodapé dela aparecia por cima do zoom.
  return createPortal(
    <div className="cardzoom" role="dialog" aria-modal="true" aria-label={card?.name}>
      {/* <button>: o iOS só entrega toques confiáveis a botões. Cobre a tela; a carta e os dados também fecham. */}
      <button type="button" className="zoom-close-area" aria-label="Fechar" onClick={onClose} />
      <div className="zoom-body">
        <button type="button" className="zoom-card" onClick={onClose} aria-hidden="true" tabIndex={-1}>
          <CardFace code={code} card={card} detail="full" />
        </button>
        {/* <div>, não <button>: dentro de um botão o iOS não rola o texto (o gesto ia para a tela). Só o texto rola. */}
        <div className="zoom-info hud cardsheet">
          <CardDetails code={code} cards={cards} />
        </div>
        {children && <div className="zoom-acc">{children}</div>}
      </div>
      <div className="zoom-foot">
        <button className="hud-btn secondary" onClick={onClose}><GameIcon name="close" size={18} /> Fechar</button>
      </div>
    </div>,
    document.body,
  );
}
