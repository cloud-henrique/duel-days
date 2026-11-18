import { useState } from 'react';
import type { CampaignState } from '../../campaign/state';
import type { Cards } from '../../data/cards';
import { validateDeck } from '../../game/decks';
import { GameIcon } from '../../ui/icons';
import { Modal } from '../../ui/Modal';
/** Quantos decks o jogador pode ter. */
export const MAX_DECKS = 5;
const NAME_MAX = 20;

/**
 * A folha dos decks (até 5): a lista com a contagem e se está pronto, e o que fazer com o deck em edição (renomear,
 * usar nos duelos, apagar) ou criar um novo. Só um deck válido pode ser o deck em uso; o último deck não se apaga.
 */
export function DeckSheet({ s, cards, editId, onEdit, onChange, onClose }: {
  s: CampaignState; cards: Cards; editId: string; onEdit: (id: string) => void; onChange: (s: CampaignState) => void; onClose: () => void;
}) {
  const deck = s.decks.find((d) => d.id === editId) ?? s.decks[0];
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(deck.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const valid = validateDeck(deck, cards, s.collection).length === 0;

  const pick = (id: string) => { onEdit(id); setRenaming(false); setConfirmDelete(false); setName(s.decks.find((d) => d.id === id)?.name ?? ''); };
  const newDeck = () => {
    if (s.decks.length >= MAX_DECKS) return;
    const id = `deck${Date.now()}`;
    onChange({ ...s, decks: [...s.decks, { id, name: `Deck ${s.decks.length + 1}`, main: [], extra: [] }] });
    pick(id);
    setName(`Deck ${s.decks.length + 1}`);
  };
  const rename = () => {
    const n = name.trim().slice(0, NAME_MAX);
    if (n) onChange({ ...s, decks: s.decks.map((d) => (d.id === deck.id ? { ...d, name: n } : d)) });
    setRenaming(false);
  };
  const del = () => {
    if (s.decks.length <= 1) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    const decks = s.decks.filter((d) => d.id !== deck.id);
    onChange({ ...s, decks, activeDeck: s.activeDeck === deck.id ? decks[0].id : s.activeDeck });
    pick(decks[0].id);
  };

  return (
    <Modal title="Seus decks" onClose={onClose} className="decksheet">
      <ul className="decklist">
        {s.decks.map((d) => {
          const n = validateDeck(d, cards, s.collection).length;
          return (
            <li key={d.id}>
              <button className={`hud-btn${d.id === deck.id ? ' on' : ''}`} onClick={() => pick(d.id)} aria-pressed={d.id === deck.id}>
                <span className="dname">{d.name}{d.id === s.activeDeck && <em className="inuse">Em uso</em>}</span>
                <small className="num">{d.main.length} cartas{d.extra.length ? ` + ${d.extra.length}` : ''} · {n ? `${n} ${n === 1 ? 'problema' : 'problemas'}` : 'pronto'}</small>
              </button>
            </li>
          );
        })}
      </ul>
      {renaming ? (
        <div className="acts">
          <input className="renamebox" value={name} maxLength={NAME_MAX} autoFocus onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') rename(); }} aria-label="Nome do deck" />
          <button className="hud-btn primary" onClick={rename}><GameIcon name="check" size={18} /> OK</button>
        </div>
      ) : (
        <div className="acts">
          <button className="hud-btn" onClick={() => { setName(deck.name); setRenaming(true); }}>Renomear</button>
          <button className={`hud-btn ${s.activeDeck === deck.id ? 'gold' : 'primary'}`} disabled={s.activeDeck === deck.id || !valid}
            onClick={() => onChange({ ...s, activeDeck: deck.id })}>
            {s.activeDeck === deck.id ? <><GameIcon name="check" size={18} /> Em uso</> : 'Usar este deck'}
          </button>
        </div>
      )}
      {!valid && s.activeDeck !== deck.id && <p className="sheetnote">Só um deck pronto pode ser usado nos duelos.</p>}
      <div className="acts">
        <button className="hud-btn" onClick={newDeck} disabled={s.decks.length >= MAX_DECKS}><GameIcon name="plus" size={18} /> Novo deck</button>
        <button className="hud-btn danger" onClick={del} disabled={s.decks.length <= 1}>
          <GameIcon name="delete" size={18} /> {confirmDelete ? 'Apagar mesmo' : 'Apagar'}
        </button>
      </div>
      <button className="hud-btn secondary" onClick={onClose}>Fechar</button>
    </Modal>
  );
}
