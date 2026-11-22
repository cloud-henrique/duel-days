import { useState } from 'react';
import { GameIcon } from '../../ui/icons';
import { Modal } from '../../ui/Modal';
import { useSync } from './SyncContext';
import { syncLabel } from './syncText';
import './sync.css';

/**
 * O indicador da sincronização (título e mapa): ícone e texto curto; tocar mostra o estado por extenso, com "Entrar"
 * quando a sessão venceu. Entrar recarrega a página, e só no toque (nunca sozinho, no meio de um duelo ou cena).
 */
export function SyncBadge({ className = '' }: { className?: string }) {
  const sync = useSync();
  const [open, setOpen] = useState(false);
  if (!sync) return null;
  const { state, engine, openConflict } = sync;
  const l = syncLabel(state);
  const tap = () => (state.status === 'conflict' ? openConflict() : setOpen(true));
  return (
    <>
      <button className={`syncbadge cut tone-${l.tone} ${className}`} onClick={tap} aria-label={`Nuvem: ${l.short}`}>
        <GameIcon name={l.icon} size={16} /><span>{l.short}</span>
      </button>
      {open && (
        <Modal title="Save na nuvem" onClose={() => setOpen(false)} className="syncdialog">
          <p>{l.long}</p>
          {state.status === 'expired' && (
            <button className="hud-btn primary" data-sound="tap" onClick={() => location.reload()}><GameIcon name="syncAlert" /> Entrar</button>
          )}
          {state.status === 'update' && (
            <button className="hud-btn primary" onClick={() => location.reload()}><GameIcon name="newGame" /> Atualizar</button>
          )}
          {state.status === 'pending' && (
            <button className="hud-btn" onClick={() => { void engine.reconcile(); setOpen(false); }}><GameIcon name="syncing" /> Tentar agora</button>
          )}
          <button className="hud-btn" onClick={() => setOpen(false)}>Fechar</button>
        </Modal>
      )}
    </>
  );
}
