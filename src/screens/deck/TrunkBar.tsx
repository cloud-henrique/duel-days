import { useState } from 'react';
import { GameIcon } from '../../ui/icons';
import { Modal } from '../../ui/Modal';
import { KINDS, SORT_DIRECTION, SORT_KEYS, SORT_NAME, type Kind, type TrunkSort } from './trunk';

/**
 * Os controles da maleta (do nativo): o botão da ordem (nome e sentido; abre a lista com "Inverter"), o botão de
 * inverter, a busca e os chips de tipo. `lead` é o botão que abre/recolhe a gaveta, no editor.
 */
export function TrunkBar({ sort, onSort, kind, onKind, query, onQuery, lead }: {
  sort: TrunkSort; onSort: (s: TrunkSort) => void; kind: Kind; onKind: (k: Kind) => void;
  query: string; onQuery: (q: string) => void; lead?: React.ReactNode;
}) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="trunkbar">
      <div className="trunkrow">
        {lead}
        <button className="hud-btn sortbtn" onClick={() => setPicking(true)} aria-label={`Ordem: ${SORT_NAME[sort.key]}, ${SORT_DIRECTION[sort.key][sort.reversed ? 1 : 0]}`}>
          <b>{SORT_NAME[sort.key]}</b>
          <small>{SORT_DIRECTION[sort.key][sort.reversed ? 1 : 0]}</small>
        </button>
        <button className={`hud-btn iconbtn invbtn${sort.reversed ? ' on' : ''}`} onClick={() => onSort({ ...sort, reversed: !sort.reversed })} aria-label="Inverter a ordem">
          <GameIcon name="sort" size={20} />
        </button>
        <label className="searchbox">
          <GameIcon name="search" size={18} />
          <input type="search" placeholder="Buscar" value={query} onChange={(e) => onQuery(e.target.value)} aria-label="Buscar pelo nome" />
        </label>
      </div>
      <div className="chips trunkchips" role="tablist">
        {KINDS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'on' : ''} onClick={() => onKind(k)}>{label}</button>
        ))}
      </div>
      {picking && (
        <Modal title="Ordenar por" onClose={() => setPicking(false)} className="sortdialog">
          <div className="sortlist">
            {SORT_KEYS.map((k) => (
              <button key={k} className={`hud-btn${sort.key === k ? ' on' : ''}`} onClick={() => { onSort({ ...sort, key: k }); setPicking(false); }}>
                {SORT_NAME[k]}{sort.key === k && <GameIcon name="check" size={16} />}
              </button>
            ))}
          </div>
          <button className="hud-btn secondary" onClick={() => { onSort({ ...sort, reversed: !sort.reversed }); setPicking(false); }}>
            <GameIcon name="sort" size={18} /> Inverter ({SORT_DIRECTION[sort.key][sort.reversed ? 0 : 1]})
          </button>
        </Modal>
      )}
    </div>
  );
}
