import { useEffect, useMemo, useRef, useState } from 'react';
import { OcgLocation, type OcgResponse } from 'ocgcore-wasm';
import type { Show } from '../../engine/protocol';
import type { DeckList } from '../../engine/session';
import type { Cards } from '../../data/cards';
import { isMonster } from '../../data/labels';
import { Backdrop, CardSheet, ICONS, art } from '../../components/CardSheet';
import { CardFace } from '../../components/CardFace';
import { LOSS_COINS, WIN_COINS } from '../../game/economy';
import { debugOn } from '../../debug/remote';
import { cardActions, highlighted, sideActions, type CardRef } from './prompt';
import { useDuelEngine } from './useDuelEngine';
import { promptPanel } from './PromptPanel';
import { Plate, type Duelist } from './Plate';
import { Field } from './Field';
import { FoeHand, Hand } from './Hand';
import { Ico } from './icons';
import { PhaseBar } from './PhaseBar';
import { DuelMenu } from './DuelMenu';
import './duel.css';

export type { Duelist } from './Plate';

/** Tempo de cada carta no destaque de ativação. */
const SHOWCASE_MS = 1300;
/** Linhas de evento que começam assim são separadores (ex.: troca de turno) e não vão para o narrador. */
const SEPARATOR = '—';

export function DuelScreen({ cards, mine, foe: foeDeck, opponent, player = { id: 'yugi_muto', name: 'Você' }, onEnd }: { cards: Cards; mine: DeckList; foe: DeckList; opponent: Duelist; player?: Duelist; onEnd: (won: boolean) => void }) {
  const [log, setLog] = useState<string[]>([]);
  const [sel, setSel] = useState<number[]>([]);
  const [sheet, setSheet] = useState<{ code: number; ref: CardRef } | null>(null);
  const [graveOf, setGraveOf] = useState<0 | 1 | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [evText, setEvText] = useState('');
  const [showQ, setShowQ] = useState<{ code: number; controller: number; k: number }[]>([]);
  const showK = useRef(0);

  const name = (code: number) => cards[String(code)]?.name ?? `#${code}`;
  const pushEvents = (ev: string[]) => {
    if (!ev.length) return;
    setLog((l) => [...l, ...ev]);
    const last = ev.filter((e) => !e.startsWith(SEPARATOR)).slice(-1)[0];
    if (last) setEvText(last);
  };
  const enqueue = (sh?: Show[]) => { if (sh?.length) setShowQ((q) => [...q, ...sh.map((x) => ({ ...x, k: ++showK.current }))]); };

  const engine = useDuelEngine({
    mine, foe: foeDeck, foeName: opponent.name,
    onPrompt: () => { setSel([]); setPeek(false); }, onEvents: pushEvents, onShows: enqueue, onLog: (line) => setLog((l) => [...l, line]),
  });
  const { board, prompt, ended, fail } = engine;

  const curShow = showQ[0];
  useEffect(() => {
    if (!curShow) return;
    const id = window.setTimeout(() => setShowQ((q) => q.slice(1)), SHOWCASE_MS);
    return () => window.clearTimeout(id);
  }, [curShow?.k]);

  const reply = (response: OcgResponse) => { setSheet(null); engine.reply(response); };
  const hl = useMemo(() => highlighted(prompt), [prompt]);
  const panel = useMemo(() => promptPanel(prompt, { name, cards, evText, sel, setSel, reply, peek: () => setPeek(true), autoPass: engine.autoPass }), [prompt, sel, cards]);

  const side = useMemo(() => {
    const acts = sideActions(prompt);
    if (acts.length) return acts.map((a) => <button key={a.label} className={a.size === 'big' ? 'side-big' : 'side-sm'} onClick={() => reply(a.response)}>{a.label}</button>);
    if (!prompt && !ended) return <div className="side-big wait">{Ico.spin}</div>; // aguardando o oponente/motor
    return null;
  }, [prompt, ended]);

  const tap = (code: number, ref: CardRef, hidden: boolean) => { if (!hidden) setSheet({ code, ref }); };
  const iconFor = (label: string, code: number) => {
    const t = cards[String(code)]?.type ?? 0;
    if (label === 'Invocar' || label === 'Invocar por efeito') return ICONS.card;
    if (label === 'Atacar') return ICONS.attack;
    if (label === 'Ataque direto') return ICONS.direct;
    if (label === 'Baixar') return isMonster(t) ? ICONS.set : ICONS.spellset;
    if (label === 'Mudar posição') return ICONS.swap;
    return ICONS.bolt;
  };
  const sheetActions = sheet ? cardActions(prompt, sheet.ref).map((a) => ({ label: a.label, primary: a.primary, icon: iconFor(a.label, sheet.code), onClick: () => reply(a.response) })) : [];

  const dbgBox = debugOn ? <div className="dbg">worker: última resposta há {engine.lastPongAgo()} s{engine.dbg.map((l, i) => <div key={i}>{l}</div>)}</div> : null;
  if (!board) return <div className="duel hexbg"><div className="stats">Carregando motor…</div>{dbgBox}{fail && <p className="errtext">{fail}</p>}</div>;
  const [me, foe] = board.players;
  const selHand = sheet && sheet.ref.location === OcgLocation.HAND && sheet.ref.controller === 0 ? sheet.ref.sequence : -1;
  const showPanel = panel && !sheet && !peek && !curShow;
  const myTurn = board.turnPlayer === 0;
  const phasebar = <PhaseBar turn={board.turn} phase={board.phase} narration={evText || `Turno ${board.turn}: ${myTurn ? player.name : opponent.name}`} />;

  return (
    <div className="duel hexbg">
      <div className="foebar">
        {!ended && <DuelMenu onSurrender={engine.surrender} />}
        <Plate side="foe" who={opponent} lp={foe.lp} deck={foe.deck} hand={foe.hand.length} grave={foe.grave} turn={!myTurn} onGrave={() => setGraveOf(1)} />
      </div>
      <FoeHand count={foe.hand.length} />
      <Field board={board} cards={cards} hl={hl} onTap={tap} center={phasebar} />
      <div className="mybar">
        <Plate side="me" who={player} lp={me.lp} deck={me.deck} hand={me.hand.length} grave={me.grave} turn={myTurn} onGrave={() => setGraveOf(0)} />
        <div className="sidebtns">{side}</div>
      </div>
      <div className="spacer" />
      <Hand hand={me.hand} cards={cards} hl={hl} selected={selHand} onTap={tap} />
      {curShow && (
        <button key={curShow.k} className="showcase" onClick={() => setShowQ((q) => q.slice(1))}>
          <div className="showcard"><CardFace code={curShow.code} card={cards[String(curShow.code)]} detail="full" /></div>
          <span>{curShow.controller === 0 ? player.name : opponent.name} ativou {name(curShow.code)}</span>
        </button>
      )}
      {debugOn && <div className="stats" style={{ textAlign: 'center' }}>{engine.info} · <button style={{ all: 'unset', textDecoration: 'underline' }} onClick={() => setLogOpen(true)}>histórico</button></div>}
      {!debugOn && <button className="logbtn" aria-label="Histórico" onClick={() => setLogOpen(true)}>⋯</button>}

      {showPanel && <div className="scrim uphand"><div className="sheet hud panel">{panel}</div></div>}
      {panel && peek && !sheet && <button className="hud-btn primary peekback" onClick={() => setPeek(false)}>{ICONS.bolt}<span>Voltar à resposta</span></button>}
      {sheet && !curShow && <CardSheet code={sheet.code} cards={cards} actions={sheetActions} aboveHand onClose={() => setSheet(null)} />}
      {graveOf !== null && (
        <div className="scrim center">
          <Backdrop onClose={() => setGraveOf(null)} />
          <div className="sheet hud">
            <h4>Cemitério de {graveOf === 0 ? player.name : opponent.name}</h4>
            {board.players[graveOf].grave.length === 0 ? <span className="stats">vazio</span>
              : <div className="grid">{board.players[graveOf].grave.map((c, i) => <img key={i} src={art(c.code, 'small')} alt={name(c.code)} onClick={() => { setGraveOf(null); setSheet({ code: c.code, ref: { controller: graveOf, location: OcgLocation.GRAVE, sequence: i } }); }} />)}</div>}
          </div>
        </div>
      )}
      {logOpen && <div className="scrim center"><Backdrop onClose={() => setLogOpen(false)} /><div className="sheet hud"><h4>Histórico</h4><div className="log">{log.map((l, i) => <div key={i}>{l}</div>)}</div></div></div>}
      {dbgBox}
      {fail && !ended && (
        <div className="scrim center"><div className="sheet hud">
          <h4>Algo deu errado no duelo</h4>
          <p className="errtext">{fail}</p>
          <button className="hud-btn primary" onClick={() => { setLog([]); engine.restart(); }}>Reiniciar o duelo</button>
          <button className="hud-btn" onClick={() => engine.setFail(null)}>Fechar</button>
        </div></div>
      )}
      {ended && <div className="scrim center"><div className="sheet hud"><h4>{ended.text}</h4><p className="stats" style={{ margin: 0 }}>+{ended.won ? WIN_COINS : LOSS_COINS} moedas</p><button className="hud-btn gold" onClick={() => onEnd(ended.won)}>Continuar</button></div></div>}
    </div>
  );
}
