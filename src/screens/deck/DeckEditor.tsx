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
import { useHover, useWide } from '../../ui/wide';
import { CARD_SIZES, useCardSize } from '../../ui/cardSize';
import { DeckCardPanel, ZoomActions, type CardEdit } from './DeckCardPanel';
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
 * Na tela larga (change layout-desktop-telas): deck | maleta | painel da carta, sem gaveta e sem zoom; o mouse mostra a
 * carta no painel, o clique a fixa, e o tamanho das cartas (P/M/G) decide as colunas.
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
  const wide = useWide();
  const hoverable = useHover() && wide;
  const [size, setSize] = useCardSize();
  /** A carta sob o mouse (tela larga); a fixada é o `zoom`. */
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => { if (!hoverable) setHover(null); }, [hoverable]);
  useEffect(() => {
    if (!wide) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wide]);

  const deck = s.decks.find((d) => d.id === editId) ?? s.decks[0];
  // A foto das cartas de cada deck no começo da visita (ou quando o deck aparece pela primeira vez nela): o "Desfazer
  // mudanças" da folha dos decks volta a ela.
  const origins = useRef(new Map(s.decks.map((d) => [d.id, { main: [...d.main], extra: [...d.extra] }])));
  if (!origins.current.has(deck.id)) origins.current.set(deck.id, { main: [...deck.main], extra: [...deck.extra] });
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

  const editOf = (code: number): CardEdit => ({
    inDeck: used[code] ?? 0, have: s.collection[code] ?? 0, canAdd: !addRefusal(deck, code, cards, s.collection),
    onAdd: () => add(code), onRemove: () => remove(code),
  });
  // Clique: no retrato abre o zoom; na tela larga fixa (ou solta) a carta no painel.
  const open = (code: number) => setZoom((z) => (wide && z === code ? null : code));
  /** As props de uma carta: arrastar e, com mouse na tela larga, o hover. */
  const cellProps = (code: number, from: DropZone) => (hoverable ? { ...bind(code, from), onPointerEnter: () => setHover(code), onPointerLeave: () => setHover((h) => (h === code ? null : h)) } : bind(code, from));
  const mainOk = deck.main.length >= MAIN_MIN && deck.main.length <= MAIN_MAX;
  const deckStyle = wide ? undefined : { height: drawer.deckHeight, '--drawer-ms': drawer.dragging || reduced ? '0ms' : `${DECK_PACING.drawerMs}ms` } as CSSProperties;

  return (
    <div className={`app hexbg deckeditor${wide ? ' wide' : ''}${dragging ? ` dragging-from-${dragging}` : ''}`}>
      <TopBar title="Meu deck" onBack={onBack}
        subtitle={<>{deck.name}{isActive && <em className="inuse"> · Em uso</em>}</>}
        right={<button className="hud-btn iconbtn" onClick={() => setSheet(true)} aria-label="Escolher o deck"><GameIcon name="deck" size={22} /></button>} />

      <header className="deckhead">
        <span className="dcount"><small>Main</small> <b className={`num${mainOk ? '' : ' bad'}`}>{deck.main.length}</b> <small>{MAIN_MIN}–{MAIN_MAX}</small></span>
        <span className="dcount extra"><small>Extra</small> <b className="num">{deck.extra.length}</b> <small>até {EXTRA_MAX}</small></span>
        {problems.length === 0
          ? <span className="readybadge cut"><GameIcon name="check" size={18} /> PRONTO</span>
          : <button className="issuebadge cut" onClick={() => setIssues(true)}><GameIcon name="warning" size={18} /> {problems.length} {problems.length === 1 ? 'problema' : 'problemas'}</button>}
      </header>

      <div className="deckbody" ref={body} style={wide ? { ['--card-w' as string]: `${CARD_SIZES[size]}px` } : undefined}>
        <section className="deckpanel" data-drop="deck" style={deckStyle} aria-label="Cartas do deck" onPointerLeave={hoverable ? () => setHover(null) : undefined}>
          {groups.length === 0 && <p className="deckempty">Deck vazio. Toque numa carta da maleta e em "Pôr no deck", ou segure e arraste até aqui.</p>}
          {groups.map((g) => (
            <div key={g.title} className={`deckgroup${g.extra ? ' extra' : ''}`}>
              <h5 className="game-title">{g.title} <span className="num">{g.codes.length}</span></h5>
              <div className="deckgrid">
                {g.codes.map((code, i) => (
                  <button key={`${code}-${i}`} className="cell" data-sound="none" aria-label={cards[code]?.name} onClick={() => open(code)} {...cellProps(code, 'deck')}>
                    <CardFace code={code} card={cards[code]} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {wide ? (
          <>
            <div className="trunk" onPointerLeave={hoverable ? () => setHover(null) : undefined}>
              <TrunkBar sort={trunk.sort} onSort={trunk.setSort} kind={trunk.kind} onKind={trunk.setKind} query={trunk.query} onQuery={trunk.setQuery} size={size} onSize={setSize} />
              <TrunkGrid copies={trunk.copies} cards={cards} tiers={data.tiers} onOpen={open} resetKey={trunk.resetKey} target={CARD_SIZES[size]}
                empty="Nenhuma carta encontrada." bind={(code) => cellProps(code, 'trunk')} drop="trunk" onScroll={hoverable ? () => setHover(null) : undefined} />
            </div>
            <DeckCardPanel code={hover ?? zoom} cards={cards} hover={hoverable} edit={(hover ?? zoom) != null ? editOf((hover ?? zoom)!) : null} />
          </>
        ) : (
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
        )}
      </div>

      {toast && <div className="decktoast" key={toast.n} role="status"><GameIcon name="warning" size={16} /> {toast.text}</div>}
      {zoom != null && !wide && (
        <CardZoom code={zoom} cards={cards} onClose={() => setZoom(null)}>
          <ZoomActions e={editOf(zoom)} />
        </CardZoom>
      )}
      {issues && (
        <Modal title="O que falta no deck" onClose={() => setIssues(false)}>
          <ul className="issuelist">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
          <button className="hud-btn primary" onClick={() => setIssues(false)}><GameIcon name="check" size={18} /> Entendi</button>
        </Modal>
      )}
      {sheet && <DeckSheet s={s} cards={cards} editId={deck.id} origin={origins.current.get(deck.id)} onEdit={setEditId} onChange={onChange} onClose={() => setSheet(false)} />}
    </div>
  );
}
