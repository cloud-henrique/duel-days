import type { ReactNode } from 'react';
import { GameIcon } from './icons';

/** Barra de topo das telas fora do duelo (como a `GameTopBar` do nativo): voltar e o título num painel chanfrado. */
export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="topbar">
      {onBack && <button className="hud-btn iconbtn" onClick={onBack} aria-label="Voltar"><GameIcon name="back" size={22} /></button>}
      <h2 className="topbar-title hud game-title">{title}</h2>
      {right}
    </div>
  );
}
