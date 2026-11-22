import type { ReactNode } from 'react';
import type { Cards } from '../../data/cards';
import { CardInfo } from '../../components/CardSheet';
import { GameIcon } from '../../ui/icons';

/** O que o editor sabe para pôr e tirar uma carta. Sem ele, o painel é só leitura (a Coleção). */
export interface CardEdit { inDeck: number; have: number; canAdd: boolean; onAdd: () => void; onRemove: () => void }

/** "No deck X · Você tem Y" e os botões Tirar/Pôr: no zoom do retrato e no painel da tela larga. */
export function ZoomActions({ e }: { e: CardEdit }) {
  return (
    <>
      <p className="zoom-count num">No deck {e.inDeck} · Você tem {e.have}</p>
      <div className="zoom-acts">
        <button className="hud-btn secondary" data-sound="none" disabled={!(e.inDeck > 0)} onClick={e.onRemove}><GameIcon name="minus" size={18} /> Tirar do deck</button>
        <button className="hud-btn primary" data-sound="none" disabled={!e.canAdd} onClick={e.onAdd}><GameIcon name="plus" size={18} /> Pôr no deck</button>
      </div>
    </>
  );
}

/**
 * Painel fixo da carta na tela larga (change layout-desktop-telas), no editor e na Coleção: a carta sob o mouse ou a
 * fixada, com os botões de pôr e tirar quando há `edit`. Sem carta, uma dica.
 */
export function DeckCardPanel({ code, cards, edit, hover, children }: { code: number | null; cards: Cards; edit?: CardEdit | null; hover: boolean; children?: ReactNode }) {
  if (code === null) {
    return (
      <aside className="cardpanel hud deckside empty">
        <p>{hover ? 'Passe o mouse numa carta para ver os detalhes; clique para fixá-la.' : 'Toque numa carta para ver os detalhes.'}
          {edit !== undefined && ' Arraste entre o deck e a maleta para pôr ou tirar.'}</p>
      </aside>
    );
  }
  return (
    <aside className="cardpanel hud deckside">
      <CardInfo code={code} cards={cards} vertical />
      {edit && <ZoomActions e={edit} />}
      {children}
    </aside>
  );
}
