import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { CardFace } from '../components/CardFace';
import { CardZoom } from '../components/CardZoom';
import type { Cards, GameData } from '../data/cards';
import { MAIN_MAX, MAIN_MIN, EXTRA_MAX, count, isExtraCard, maxCopiesOf, validateDeck, type Deck } from '../game/decks';
import type { Tier } from '../data/cards';
import type { CampaignState } from '../campaign/state';
import { GameIcon } from '../ui/icons';
import { PerfScroll, perfEnabled } from '../dev/PerfScroll';
import { TopBar } from '../ui/TopBar';
import { useVirtualGrid, type GridOptions } from '../ui/virtualGrid';

type Kind = 'all' | 'mon' | 'mag' | 'arm' | 'fus';
type Sort = 'nome' | 'atk' | 'nivel' | 'raridade';
const KINDS: [Kind, string][] = [['all', 'Todas'], ['mon', 'Monstros'], ['mag', 'Magias'], ['arm', 'Armadilhas'], ['fus', 'Fusão']];
const TIER_ORDER: Record<Tier, number> = { N: 0, R: 1, SR: 2, UR: 3 };
export const MAX_DECKS = 5;
/** Grade do editor: 4 colunas, 7 de espaço, 2 + 2 de margem lateral, borda de 2 na célula (o `.cardgrid` do CSS). */
const GRID: GridOptions = { cols: 4, gap: 4, padX: 4, border: 2, overscan: 2 };

export function DeckBuilder({ progress, data, onChange, onBack }: { progress: CampaignState; data: GameData; onChange: (p: CampaignState) => void; onBack: () => void }) {
  const { cards, tiers } = data;
  const [editId, setEditId] = useState(progress.activeDeck);
  const [tab, setTab] = useState<'colecao' | 'deck'>('colecao');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [sort, setSort] = useState<Sort>('nome');
  const [open, setOpen] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const deck = progress.decks.find((d) => d.id === editId) ?? progress.decks[0];
  const used = useMemo(() => count([...deck.main, ...deck.extra]), [deck]);
  const problems = useMemo(() => validateDeck(deck, cards, progress.collection), [deck, cards, progress.collection]);
  const save = (d: Deck) => onChange({ ...progress, decks: progress.decks.map((x) => (x.id === d.id ? d : x)) });

  const canAdd = (code: number) => {
    const c = cards[code];
    const own = progress.collection[code] ?? 0;
    const full = isExtraCard(c) ? deck.extra.length >= EXTRA_MAX : deck.main.length >= MAIN_MAX;
    return (used[code] ?? 0) < Math.min(maxCopiesOf(code), own) && !full;
  };
  const add = (code: number) => canAdd(code) && save(isExtraCard(cards[code]) ? { ...deck, extra: [...deck.extra, code] } : { ...deck, main: [...deck.main, code] });
  const remove = (code: number) => {
    const list = isExtraCard(cards[code]) ? 'extra' : 'main';
    const i = deck[list].lastIndexOf(code);
    if (i >= 0) save({ ...deck, [list]: deck[list].filter((_, k) => k !== i) });
  };

  const matches = (code: number) => {
    const c = cards[code];
    if (!c) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (kind === 'mon') return (c.type & 1) !== 0 && !isExtraCard(c);
    if (kind === 'mag') return (c.type & 2) !== 0;
    if (kind === 'arm') return (c.type & 4) !== 0;
    if (kind === 'fus') return isExtraCard(c);
    return true;
  };
  const sortFn = (a: number, b: number) => {
    const A = cards[a], B = cards[b];
    if (sort === 'atk') return B.attack - A.attack || A.name.localeCompare(B.name);
    if (sort === 'nivel') return B.level - A.level || A.name.localeCompare(B.name);
    if (sort === 'raridade') return TIER_ORDER[tiers[b]] - TIER_ORDER[tiers[a]] || A.name.localeCompare(B.name);
    return A.name.localeCompare(B.name);
  };
  const list = useMemo(() => {
    const codes = tab === 'colecao' ? Object.keys(progress.collection).map(Number) : Object.keys(used).map(Number);
    return codes.filter(matches).sort(sortFn);
  }, [tab, progress.collection, used, q, kind, sort]);
  /**
   * Cada cópia é uma miniatura, as iguais seguidas (mais fácil de ver quantas há do que um contador "2/3"). Na
   * coleção, as primeiras cópias de cada carta são as que estão no deck: ficam apagadas, com a marca.
   */
  const copies = useMemo(() => list.flatMap((code) => {
    const n = tab === 'colecao' ? progress.collection[code] ?? 0 : used[code] ?? 0;
    return Array.from({ length: n }, (_, i) => ({ code, n: i, inDeck: i < (used[code] ?? 0) }));
  }), [list, tab, progress.collection, used]);
  const range = useVirtualGrid(gridRef, copies.length, GRID);
  // Trocar de aba, filtro, busca ou ordem volta a grade ao topo.
  useEffect(() => { if (gridRef.current) gridRef.current.scrollTop = 0; }, [tab, kind, q, sort]);

  const newDeck = () => {
    if (progress.decks.length >= MAX_DECKS) return;
    const id = `deck${Date.now()}`;
    onChange({ ...progress, decks: [...progress.decks, { id, name: `Deck ${progress.decks.length + 1}`, main: [], extra: [] }] });
    setEditId(id);
  };
  const del = () => {
    if (progress.decks.length <= 1) return;
    const decks = progress.decks.filter((d) => d.id !== deck.id);
    onChange({ ...progress, decks, activeDeck: progress.activeDeck === deck.id ? decks[0].id : progress.activeDeck });
    setEditId(decks[0].id);
  };
  const isActive = progress.activeDeck === deck.id;

  return (
    <div className="app deckb hexbg">
      <TopBar title="Decks" onBack={onBack}
        subtitle={`${Object.keys(progress.collection).filter((id) => cards[id]).length} cartas diferentes na coleção`} />

      <div className="deckbar hud">
        <select value={deck.id} onChange={(e) => setEditId(e.target.value)}>
          {progress.decks.map((d) => <option key={d.id} value={d.id}>{d.name}{d.id === progress.activeDeck ? ' (em uso)' : ''}</option>)}
        </select>
        <input value={deck.name} maxLength={20} onChange={(e) => save({ ...deck, name: e.target.value })} />
        <button className="hud-btn" onClick={newDeck} disabled={progress.decks.length >= MAX_DECKS} aria-label="Novo deck"><GameIcon name="plus" size={20} /></button>
        <button className="hud-btn" onClick={del} disabled={progress.decks.length <= 1} aria-label="Apagar deck"><GameIcon name="delete" size={20} /></button>
      </div>
      <div className="deckstat">
        <span className={`num ${deck.main.length >= MAIN_MIN && deck.main.length <= MAIN_MAX ? 'ok' : 'bad'}`}>Principal {deck.main.length}/{MAIN_MIN}–{MAIN_MAX}</span>
        <span className={`num ${deck.extra.length <= EXTRA_MAX ? 'ok' : 'bad'}`}>Extra {deck.extra.length}/{EXTRA_MAX}</span>
        <button className={`hud-btn ${isActive ? 'gold' : ''}`} onClick={() => onChange({ ...progress, activeDeck: deck.id })} disabled={isActive || problems.length > 0}>{isActive ? <><GameIcon name="check" /> Em uso</> : 'Usar'}</button>
      </div>
      {problems.length > 0 && <div className="problems">{problems.slice(0, 3).map((p) => <div key={p}>• {p}</div>)}{problems.length > 3 && <div>… e mais {problems.length - 3}</div>}</div>}

      <div className="tabs">
        <button className={tab === 'colecao' ? 'on' : ''} onClick={() => setTab('colecao')}>Coleção</button>
        <button className={tab === 'deck' ? 'on' : ''} onClick={() => setTab('deck')}>Deste deck</button>
      </div>
      <div className="filters">
        <input placeholder="Buscar pelo nome" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="nome">Nome</option><option value="atk">ATK</option><option value="nivel">Nível</option><option value="raridade">Raridade</option>
        </select>
      </div>
      <div className="chips">{KINDS.map(([k, label]) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{label}</button>)}</div>

      {/* Virtualizada: só as linhas visíveis (e 2 de folga) existem; o resto vira espaço em cima e embaixo. */}
      <div className="cardgrid virtual" ref={gridRef}>
        {copies.length === 0 && <div className="stats" style={{ textAlign: 'center', padding: 24 }}>{tab === 'deck' ? 'Nenhuma carta neste deck ainda. Adicione pela aba Coleção.' : 'Nenhuma carta encontrada.'}</div>}
        <div className="vgrid" style={{ paddingTop: range.padTop, paddingBottom: range.padBottom }}>
          {copies.slice(range.first, range.end).map(({ code, n, inDeck }) => (
            <GridCell key={`${code}-${n}`} code={code} card={cards[code]} tier={tiers[code]} mark={inDeck && tab === 'colecao'} onOpen={setOpen} />
          ))}
        </div>
      </div>

      {perfEnabled() && <PerfScroll target={gridRef} label={`Grade (${tab}, ${copies.length} cópias)`} />}
      {open != null && (
        <CardZoom code={open} cards={cards} onClose={() => setOpen(null)}>
          <p className="zoom-count num">No deck {used[open] ?? 0} · Você tem {progress.collection[open] ?? 0}</p>
          <div className="zoom-acts">
            <button className="hud-btn secondary" disabled={!(used[open] > 0)} onClick={() => remove(open)}><GameIcon name="minus" size={18} /> Tirar do deck</button>
            <button className="hud-btn primary" disabled={!canAdd(open)} onClick={() => add(open)}><GameIcon name="plus" size={18} /> Pôr no deck</button>
          </div>
        </CardZoom>
      )}
    </div>
  );
}

/** Uma cópia na grade. Memorizada: ao rolar, só as células que entram na tela são desenhadas. */
const GridCell = memo(function GridCell({ code, card, tier, mark, onOpen }: { code: number; card: Cards[string]; tier: Tier; mark: boolean; onOpen: (code: number) => void }) {
  return (
    <button className={`cell r-${tier}${mark ? ' indeck' : ''}`} aria-label={card.name} onClick={() => onOpen(code)}>
      <CardFace code={code} card={card} />
      {mark && <i aria-label="No deck"><GameIcon name="check" size={12} /></i>}
    </button>
  );
});
