import { useEffect, useMemo, useRef, useState } from 'react';
import { OcgLocation, OcgMessageType, OcgPhase, type OcgResponse } from 'ocgcore-wasm';
import type { Step } from '../../engine/protocol';
import { beatText } from '../../engine/beats';
import type { DeckList } from '../../engine/session';
import { DEFAULT_SETTINGS, type Settings } from '../../story/progress';
import type { Cards } from '../../data/cards';
import { Backdrop, CardSheet, ICONS, art } from '../../components/CardSheet';
import { CardFace } from '../../components/CardFace';
import { LOSS_COINS, WIN_COINS } from '../../game/economy';
import { debugOn } from '../../debug/remote';
import { cardActions, highlighted, refKey, sideActions, type CardRef } from './prompt';
import { choiceMarks, choiceOf, tapOption } from './choice';
import { ChoiceBar } from './ChoicePanels';
import { useDuelEngine } from './useDuelEngine';
import { SHOWCASE_MS } from './pacing';
import { promptPanel } from './PromptPanel';
import { Plate, type Duelist } from './Plate';
import { Field } from './Field';
import { FoeHand, Hand } from './Hand';
import { Ico } from './icons';
import { PhaseBar } from './PhaseBar';
import { DuelMenu } from './DuelMenu';
import './duel.css';

export type { Duelist } from './Plate';

/** Fase de batalha (todos os sub-passos): o alvo escolhido depois de "Atacar" é o de ataque. */
const BATTLE = OcgPhase.BATTLE_START | OcgPhase.BATTLE_STEP | OcgPhase.DAMAGE | OcgPhase.DAMAGE_CAL | OcgPhase.BATTLE;
const isBattle = (phase: number) => (phase & BATTLE) !== 0;
/** Linhas de evento que começam assim são separadores (ex.: troca de turno) e não vão para o narrador. */
const SEPARATOR = '—';

export function DuelScreen({ cards, mine, foe: foeDeck, opponent, player = { id: 'yugi_muto', name: 'Você' }, settings = DEFAULT_SETTINGS, onSettings = () => {}, onEnd }: {
  cards: Cards; mine: DeckList; foe: DeckList; opponent: Duelist; player?: Duelist;
  /** Preferências do jogador (animações, som) e como salvá-las. */
  settings?: Settings; onSettings?: (s: Settings) => void;
  onEnd: (won: boolean) => void;
}) {
  const [log, setLog] = useState<string[]>([]);
  const [sel, setSel] = useState<number[]>([]);
  const [sheet, setSheet] = useState<{ code: number; ref: CardRef } | null>(null);
  const [graveOf, setGraveOf] = useState<0 | 1 | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [evText, setEvText] = useState('');
  const [showQ, setShowQ] = useState<{ code: number; controller: number; k: number }[]>([]);
  const showK = useRef(0);
  /** A carta que age: a última que o jogador mandou agir (ou a última ativada). `attack` quando foi "Atacar". */
  const [actor, setActor] = useState<{ code: number; attack: boolean } | null>(null);

  const name = (code: number) => cards[String(code)]?.name ?? `#${code}`;
  const pushEvents = (ev: string[]) => {
    if (!ev.length) return;
    setLog((l) => [...l, ...ev]);
    const last = ev.filter((e) => !e.startsWith(SEPARATOR)).slice(-1)[0];
    if (last) setEvText(last);
  };
  const onStep = ({ beat }: Step) => {
    pushEvents(beatText(beat, name));
    if (beat.k !== 'activate') return;
    setShowQ((q) => [...q, { code: beat.code, controller: beat.p, k: ++showK.current }]);
    setActor({ code: beat.code, attack: false });
  };

  const engine = useDuelEngine({
    mine, foe: foeDeck, foeName: opponent.name,
    onPrompt: () => { setSel([]); setPeek(false); }, onStep, onNotice: (t) => pushEvents([t]), onLog: (line) => setLog((l) => [...l, line]),
  });
  const { board, prompt, ended, fail } = engine;

  const curShow = showQ[0];
  useEffect(() => {
    if (!curShow) return;
    const id = window.setTimeout(() => setShowQ((q) => q.slice(1)), SHOWCASE_MS);
    return () => window.clearTimeout(id);
  }, [curShow?.k]);

  const reply = (response: OcgResponse) => { setSheet(null); engine.reply(response); };
  const choice = useMemo(() => choiceOf(prompt), [prompt]);
  const boardChoice = choice?.mode === 'board' ? choice : null;
  const marks = useMemo(() => choiceMarks(boardChoice, sel), [boardChoice, sel]);
  const hl = useMemo(() => (boardChoice ? marks.glow : highlighted(prompt)), [prompt, boardChoice, marks]);
  const panel = useMemo(() => promptPanel(prompt, { name, cards, evText, sel, setSel, reply, autoPass: engine.autoPass }), [prompt, sel, cards]);

  const side = useMemo(() => {
    const acts = sideActions(prompt);
    if (acts.length) return acts.map((a) => <button key={a.label} className={a.size === 'big' ? 'side-big' : 'side-sm'} onClick={() => reply(a.response)}>{a.label}</button>);
    if (!prompt && !ended) return <div className="side-big wait">{Ico.spin}</div>; // aguardando o oponente/motor
    return null;
  }, [prompt, ended]);

  const tap = (code: number, ref: CardRef, hidden: boolean) => {
    // Escolha no tabuleiro: tocar numa carta que vale marca (ou desmarca); o toque que completa já responde.
    const picked = boardChoice && !sheet ? tapOption(boardChoice, sel, ref) : null;
    if (picked) { setSel(picked.sel); if (picked.response) reply(picked.response); return; }
    if (hidden) return;
    // Tocar de novo na carta aberta fecha a folha.
    if (sheet && refKey(sheet.ref) === refKey(ref)) { setSheet(null); return; }
    setSheet({ code, ref });
  };
  const iconFor = (label: string) => {
    if (label === 'Invocar') return ICONS.summon;
    if (label === 'Invocar por efeito') return ICONS.special;
    if (label === 'Atacar') return ICONS.attack;
    if (label === 'Ataque direto') return ICONS.direct;
    if (label === 'Baixar') return ICONS.set;
    if (label === 'Mudar posição') return ICONS.swap;
    return ICONS.activate;
  };
  const sheetActions = sheet ? cardActions(prompt, sheet.ref).map((a) => ({ label: a.label, primary: a.primary, icon: iconFor(a.label), onClick: () => { setActor({ code: sheet.code, attack: a.label === 'Atacar' }); reply(a.response); } })) : [];

  const dbgBox = debugOn ? <div className="dbg">worker: última resposta há {engine.lastPongAgo()} s{engine.dbg.map((l, i) => <div key={i}>{l}</div>)}</div> : null;
  if (!board) return <div className="duel hexbg"><div className="stats">Carregando motor…</div>{dbgBox}{fail && <p className="errtext">{fail}</p>}</div>;
  const [me, foe] = board.players;
  const selHand = sheet && sheet.ref.location === OcgLocation.HAND && sheet.ref.controller === 0 ? sheet.ref.sequence : -1;
  // Escondido (e não desmontado) enquanto se olha o campo: o painel guarda o que estava marcado ou ordenado.
  const panelHidden = !!sheet || peek || !!curShow;
  const isChain = prompt?.type === OcgMessageType.SELECT_CHAIN;
  const myTurn = board.turnPlayer === 0;
  const phasebar = <PhaseBar turn={board.turn} phase={board.phase} narration={evText || `Turno ${board.turn}: ${myTurn ? player.name : opponent.name}`} />;

  const pickAttack = !!boardChoice && !!actor?.attack && isBattle(board.phase);
  return (
    <div className={`duel hexbg${pickAttack ? ' pick-attack' : ''}`}>
      <div className="foebar">
        {!ended && <DuelMenu onSurrender={engine.surrender} settings={settings} onSettings={onSettings} />}
        <Plate side="foe" who={opponent} lp={foe.lp} deck={foe.deck} hand={foe.hand.length} grave={foe.grave} turn={!myTurn} onGrave={() => setGraveOf(1)} />
      </div>
      <FoeHand count={foe.hand.length} />
      <Field board={board} cards={cards} hl={hl} picked={marks.picked} onTap={tap} center={phasebar} />
      <div className="mybar">
        <Plate side="me" who={player} lp={me.lp} deck={me.deck} hand={me.hand.length} grave={me.grave} turn={myTurn} onGrave={() => setGraveOf(0)} />
        <div className="sidebtns">{side}</div>
      </div>
      <div className="spacer" />
      <Hand hand={me.hand} cards={cards} hl={hl} picked={marks.picked} selected={selHand} onTap={tap} />
      {curShow && (
        <button key={curShow.k} className="showcase" onClick={() => setShowQ((q) => q.slice(1))}>
          <div className="showcard"><CardFace code={curShow.code} card={cards[String(curShow.code)]} detail="full" /></div>
          <span>{curShow.controller === 0 ? player.name : opponent.name} ativou {name(curShow.code)}</span>
        </button>
      )}
      {debugOn && <div className="stats" style={{ textAlign: 'center' }}>{engine.info} · <button style={{ all: 'unset', textDecoration: 'underline' }} onClick={() => setLogOpen(true)}>histórico</button></div>}
      {!debugOn && <button className="logbtn" aria-label="Histórico" onClick={() => setLogOpen(true)}>⋯</button>}

      {panel && (
        <div className={`scrim uphand${panelHidden ? ' gone' : ''}`} aria-hidden={panelHidden}>
          <div className="sheet hud panel">
            {panel}
            <button className="hud-btn wide" onClick={() => setPeek(true)}>{ICONS.eye}<span>Ver campo</span></button>
          </div>
        </div>
      )}
      {boardChoice && !sheet && !curShow && <ChoiceBar c={boardChoice} sel={sel} cards={cards} actor={actor?.code ?? null} attack={pickAttack} reply={reply} />}
      {panel && peek && !sheet && (
        <div className="peekbar hud panel">
          <span>{ICONS.eye}Só olhando: toque numa carta para ampliar</span>
          <button className="hud-btn primary" onClick={() => setPeek(false)}>{isChain ? 'Voltar à resposta' : 'Voltar à escolha'}</button>
        </div>
      )}
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
