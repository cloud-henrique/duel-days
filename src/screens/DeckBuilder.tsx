import { useMemo, useState } from 'react';
import { CardSheet, art } from '../components/CardSheet';
import type { GameData } from '../data/cards';
import { MAIN_MAX, MAIN_MIN, EXTRA_MAX, MAX_COPIES, count, isExtraCard, validateDeck, type Deck } from '../game/decks';
import type { Tier } from '../game/packs';
import type { Progress } from '../story/progress';

type Kind = 'all' | 'mon' | 'mag' | 'arm' | 'fus';
type Sort = 'nome' | 'atk' | 'nivel' | 'raridade';
const KINDS: [Kind, string][] = [['all', 'Todas'], ['mon', 'Monstros'], ['mag', 'Magias'], ['arm', 'Armadilhas'], ['fus', 'Fusão']];
const TIER_ORDER: Record<Tier, number> = { N: 0, R: 1, SR: 2, UR: 3 };
export const MAX_DECKS = 5;

export function DeckBuilder({ progress, data, onChange, onBack }: { progress: Progress; data: GameData; onChange: (p: Progress) => void; onBack: () => void }) {
  const { cards, tiers } = data;
  const [editId, setEditId] = useState(progress.activeDeck);
  const [tab, setTab] = useState<'colecao' | 'deck'>('colecao');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [sort, setSort] = useState<Sort>('nome');
  const [open, setOpen] = useState<number | null>(null);

  const deck = progress.decks.find((d) => d.id === editId) ?? progress.decks[0];
  const used = useMemo(() => count([...deck.main, ...deck.extra]), [deck]);
  const problems = validateDeck(deck, cards, progress.collection);
  const save = (d: Deck) => onChange({ ...progress, decks: progress.decks.map((x) => (x.id === d.id ? d : x)) });

  const canAdd = (code: number) => {
    const c = cards[code];
    const own = progress.collection[code] ?? 0;
    const full = isExtraCard(c) ? deck.extra.length >= EXTRA_MAX : deck.main.length >= MAIN_MAX;
    return (used[code] ?? 0) < Math.min(MAX_COPIES, own) && !full;
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
      <div className="hubtop">
        <button className="hud-btn" onClick={onBack}>←</button>
        <b className="hubname">Decks</b>
        <span className="stats">{Object.keys(progress.collection).length} cartas diferentes</span>
      </div>

      <div className="deckbar hud">
        <select value={deck.id} onChange={(e) => setEditId(e.target.value)}>
          {progress.decks.map((d) => <option key={d.id} value={d.id}>{d.name}{d.id === progress.activeDeck ? ' ★' : ''}</option>)}
        </select>
        <input value={deck.name} maxLength={20} onChange={(e) => save({ ...deck, name: e.target.value })} />
        <button className="hud-btn" onClick={newDeck} disabled={progress.decks.length >= MAX_DECKS}>＋</button>
        <button className="hud-btn" onClick={del} disabled={progress.decks.length <= 1}>🗑</button>
      </div>
      <div className="deckstat">
        <span className={deck.main.length >= MAIN_MIN && deck.main.length <= MAIN_MAX ? 'ok' : 'bad'}>Principal {deck.main.length}/{MAIN_MIN}–{MAIN_MAX}</span>
        <span className={deck.extra.length <= EXTRA_MAX ? 'ok' : 'bad'}>Extra {deck.extra.length}/{EXTRA_MAX}</span>
        <button className={`hud-btn ${isActive ? 'gold' : ''}`} onClick={() => onChange({ ...progress, activeDeck: deck.id })} disabled={isActive || problems.length > 0}>{isActive ? '★ Em uso' : 'Usar'}</button>
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

      <div className="cardgrid">
        {list.length === 0 && <div className="stats" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 24 }}>{tab === 'deck' ? 'Nenhuma carta neste deck ainda. Adicione pela aba Coleção.' : 'Nenhuma carta encontrada.'}</div>}
        {list.map((code) => (
          <button key={code} className={`cell r-${tiers[code]}`} onClick={() => setOpen(code)}>
            <img loading="lazy" src={art(code, 'small')} alt={cards[code].name} draggable={false} />
            <i className={(used[code] ?? 0) >= Math.min(MAX_COPIES, progress.collection[code] ?? 0) ? 'full' : ''}>
              {tab === 'colecao' ? `${used[code] ?? 0}/${progress.collection[code]}` : `×${used[code]}`}
            </i>
          </button>
        ))}
      </div>

      {open != null && (
        <CardSheet code={open} cards={cards} onClose={() => setOpen(null)} actions={[
          { label: `Adicionar (${used[open] ?? 0}/${Math.min(MAX_COPIES, progress.collection[open] ?? 0)})`, primary: true, disabled: !canAdd(open), onClick: () => add(open) },
          { label: 'Remover', disabled: !(used[open] > 0), onClick: () => remove(open) },
        ]} />
      )}
    </div>
  );
}
