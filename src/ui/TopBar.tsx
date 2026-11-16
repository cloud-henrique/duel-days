import type { ReactNode } from 'react';
import { GameIcon } from './icons';

/**
 * Barra de topo das telas fora do duelo (a `GameTopBar` do nativo): o voltar e a faixa do título, em marinho que some
 * para a direita, com o título em caixa alta na fonte do jogo e com brilho ciano; embaixo, o subtítulo em ciano.
 */
export function TopBar({ title, subtitle, onBack, right }: { title: string; subtitle?: ReactNode; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="topbar">
      {onBack && <button className="hud-btn iconbtn" onClick={onBack} aria-label="Voltar"><GameIcon name="back" size={22} /></button>}
      <div className="topbar-title hud">
        <h2 className="game-title">{title}</h2>
        {subtitle && <small>{subtitle}</small>}
      </div>
      {right}
    </div>
  );
}
