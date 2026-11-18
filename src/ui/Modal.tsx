import type { ReactNode } from 'react';
import { Backdrop } from '../components/CardSheet';
import './modal.css';

/**
 * Um diálogo do jogo por cima da tela: o véu escuro (tocar fora fecha, pelo `Backdrop`, um <button>) e um painel do
 * HUD com o título. Usado pela loja (ajuda, caixa) e pelo editor (decks, problemas, ordem).
 */
export function Modal({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const id = `modal-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="gamemodal" role="dialog" aria-modal="true" aria-labelledby={id}>
      <Backdrop onClose={onClose} />
      <div className={`hud panelbox gamedialog ${className}`}>
        <h4 id={id} className="game-title">{title}</h4>
        {children}
      </div>
    </div>
  );
}
