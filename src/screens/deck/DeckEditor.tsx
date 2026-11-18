import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { sfx } from '../../audio/sfx';
import type { CampaignState } from '../../campaign/state';
import { CardFace } from '../../components/CardFace';
import { CardZoom } from '../../components/CardZoom';
import type { GameData } from '../../data/cards';
import { EXTRA_MAX, MAIN_MAX, MAIN_MIN, addRefusal, count, isExtraCard, validateDeck, type Deck } from '../../game/decks';
import { GameIcon } from '../../ui/icons';
import { Modal } from '../../ui/Modal';
import { TopBar } from '../../ui/TopBar';
import { useReducedMotion } from '../duel/anim/useReducedMotion';
import { DeckSheet } from './DeckSheet';
import { DECK_PACING } from './pacing';
import { deckGroups, trunkSummary } from './trunk';
import { TrunkBar } from './TrunkBar';
import { TrunkGrid } from './TrunkGrid';
import { useCardDrag, type DropZone } from './useCardDrag';
import { useDrawer } from './useDrawer';
import { useTrunk } from './useTrunk';
import './deck.css';

/**
 * O editor "Meu deck" no visual do nativo (`DeckEditorView`): o cabeçalho com as contagens e o selo de pronto, o deck
 * em edição agrupado em cima e a maleta (a coleção) numa gaveta embaixo. Pôr e tirar pelo zoom ou arrastando entre os
 * dois. Até 5 decks, escolhidos pela folha do topo. Grava a cada mudança (`onChange`).
 */
export function DeckEditor({ progress: s, data, onChange, onBack }: {
  progress: CampaignState; data: GameData; onChange: (s: CampaignState) => void; onBack: () => void;
}) {
  const { cards } = data;
  const reduced = useReducedMotion();
  const [editId, setEditId] = useState(s.activeDeck);
  const [zoom, setZoom] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [issues, setIssues] = useState(false);
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const drawer = useDrawer(body);

  const deck = s.decks.find((d) => d.id === editId) ?? s.decks[0];
  const used = useMemo(() => count([...deck.main, ...deck.extra]), [deck]);
  const problems = useMemo(() => validateDeck(deck, cards, s.collection), [deck, cards, s.collection]);
  const groups = useMemo(() => deckGroups(deck, cards), [deck, cards]);
  const trunk = useTrunk(s, data, used);
  const isActive = s.activeDeck === deck.id;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), DECK_PACING.toastMs);
    return () => clearTimeout(t);
  }, [toast?.n]);

  const save = (d: Deck) => onChange({ ...s, decks: s.decks.map((x) => (x.id === d.id ? d : x)) });
  /** Põe uma cópia; recusada, mostra o motivo (no arrastar) e devolve false. */
  const add = (code: number, warn = false): boolean => {
    const why = addRefusal(deck, code, cards, s.collection);
    if (why) { if (warn) setToast({ text: why, n: (toast?.n ?? 0) + 1 }); return false; }
    sfx.play('cardAdd');
    save(isExtraCard(cards[code]) ? { ...deck, extra: [...deck.extra, code] } : { ...deck, main: [...deck.main, code] });
    return true;
  };
  const remove = (code: number): boolean => {
    const list = isExtraCard(cards[code]) ? 'extra' : 'main';
    const i = deck[list].lastIndexOf(code);
    if (i < 0) return false;
    sfx.play('cardRemove');
    save({ ...deck, [list]: deck[list].filter((_, k) => k !== i) });
    return true;
  };
  const { bind, dragging } = useCardDrag((code, from, to: DropZone) => (from === 'trunk' && to === 'deck' ? add(code, true) : from === 'deck' && to === 'trunk' ? remove(code) : false), reduced);

  const mainOk = deck.main.length >= MAIN_MIN && deck.main.length <= MAIN_MAX;
  const deckStyle = { height: drawer.deckHeight, '--drawer-ms': drawer.dragging || reduced ? '0ms' : `${DECK_PACING.drawerMs}ms` } as CSSProperties;

  return (
    <div className={`app hexbg deckeditor${dragging ? ` dragging-from-${dragging}` : ''}`}>
      <TopBar title="Meu deck" onBack={onBack}
        subtitle={<>{deck.name}{isActive && <em className="inuse"> · Em uso</em>}</>}
        right={<button className="hud-btn iconbtn" onClick={() => setSheet(true)} aria-label="Escolher o deck"><GameIcon name="deck" size={22} /></button>} />

      <header className="deckhead">
        <span className="dcount"><small>Main</small> <b className={`num${mainOk ? '' : ' bad'}`}>{deck.main.length}</b> <small>{MAIN_MIN}–{MAIN_MAX}</small></span>
        <span className="dcount extra"><small>Extra</small> <b className="num">{deck.extra.length}</b> <small>até {EXTRA_MAX}</small></span>
        {problems.length === 0
          ? <span className="readybadge"><GameIcon name="check" size={18} /> PRONTO</span>
          : <button className="issuebadge" onClick={() => setIssues(true)}><GameIcon name="warning" size={18} /> {problems.length} {problems.length === 1 ? 'problema' : 'problemas'}</button>}
      </header>

      <div className="deckbody" ref={body}>
        <section className="deckpanel" data-drop="deck" style={deckStyle} aria-label="Cartas do deck">
          {groups.length === 0 && <p className="deckempty">Deck vazio. Toque numa carta da maleta e em "Pôr no deck", ou segure e arraste até aqui.</p>}
          {groups.map((g) => (
            <div key={g.title} className={`deckgroup${g.extra ? ' extra' : ''}`}>
              <h5 className="game-title">{g.title} <span className="num">{g.codes.length}</span></h5>
              <div className="deckgrid">
                {g.codes.map((code, i) => (
                  <button key={`${code}-${i}`} className="cell" data-sound="none" aria-label={cards[code]?.name} onClick={() => setZoom(code)} {...bind(code, 'deck')}>
                    <CardFace code={code} card={cards[code]} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="trunk">
          <button className="drawerhandle" data-sound="none" aria-label={drawer.pos === 'collapsed' ? 'Abrir a maleta' : drawer.pos === 'middle' ? 'Abrir mais a maleta' : 'Recolher a maleta'} {...drawer.handle}>
            <span className="grip" aria-hidden="true" />
            {drawer.pos === 'collapsed' && <span className="handlesum">Maleta · {trunkSummary(trunk.sort, trunk.kind, trunk.query)}</span>}
          </button>
          {drawer.pos !== 'collapsed' && (
            <>
              <TrunkBar sort={trunk.sort} onSort={trunk.setSort} kind={trunk.kind} onKind={trunk.setKind} query={trunk.query} onQuery={trunk.setQuery}
                lead={<button className={`hud-btn iconbtn drawerbtn${drawer.pos === 'open' ? ' up' : ''}`} onClick={() => drawer.setPos(drawer.pos === 'open' ? 'collapsed' : 'open')}
                  aria-label={drawer.pos === 'open' ? 'Recolher a maleta' : 'Abrir a maleta'}><GameIcon name="chevron" size={20} /></button>} />
              <TrunkGrid copies={trunk.copies} cards={cards} tiers={data.tiers} onOpen={setZoom} resetKey={trunk.resetKey}
                empty="Nenhuma carta encontrada." bind={(code) => bind(code, 'trunk')} drop="trunk" />
            </>
          )}
        </div>
      </div>

      {toast && <div className="decktoast" key={toast.n} role="status"><GameIcon name="warning" size={16} /> {toast.text}</div>}
      {zoom != null && (
        <CardZoom code={zoom} cards={cards} onClose={() => setZoom(null)}>
          <p className="zoom-count num">No deck {used[zoom] ?? 0} · Você tem {s.collection[zoom] ?? 0}</p>
          <div className="zoom-acts">
            <button className="hud-btn secondary" data-sound="none" disabled={!(used[zoom] > 0)} onClick={() => remove(zoom)}><GameIcon name="minus" size={18} /> Tirar do deck</button>
            <button className="hud-btn primary" data-sound="none" disabled={!!addRefusal(deck, zoom, cards, s.collection)} onClick={() => add(zoom)}><GameIcon name="plus" size={18} /> Pôr no deck</button>
          </div>
        </CardZoom>
      )}
      {issues && (
        <Modal title="O que falta no deck" onClose={() => setIssues(false)}>
          <ul className="issuelist">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
          <button className="hud-btn primary" onClick={() => setIssues(false)}><GameIcon name="check" size={18} /> Entendi</button>
        </Modal>
      )}
      {sheet && <DeckSheet s={s} cards={cards} editId={deck.id} onEdit={setEditId} onChange={onChange} onClose={() => setSheet(false)} />}
    </div>
  );
}
