import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { CpuKind } from '../../engine/search';
import { OcgLocation, OcgMessageType, OcgPhase, type OcgResponse } from 'ocgcore-wasm';
import type { Step } from '../../engine/protocol';
import { beatText } from '../../engine/beats';
import type { DeckList } from '../../engine/session';
import { DEFAULT_SETTINGS, type Settings } from '../../story/progress';
import type { Cards } from '../../data/cards';
import { Backdrop, CardSheet, ICONS } from '../../components/CardSheet';
import { CardFace } from '../../components/CardFace';
import { debugOn } from '../../debug/remote';
import { cardActions, highlighted, refKey, sideActions, type CardRef } from './prompt';
import { choiceMarks, choiceOf, confirmResponse, tapOption } from './choice';
import { ChoiceBar } from './ChoicePanels';
import { useDuelEngine } from './useDuelEngine';
import { useBeatQueue } from './anim/useBeatQueue';
import { useReducedMotion } from './anim/useReducedMotion';
import { sfx } from '../../audio/sfx';
import { music } from '../../audio/music';
import { Splash } from './anim/Splash';
import { ChainStack } from './anim/ChainStack';
import { Toss } from './anim/Toss';
import { Intro, wantsIntro } from './anim/Intro';
import { Outro, type OutroReward } from './anim/Outro';
import { promptPanel } from './PromptPanel';
import { Plate, type Duelist } from './Plate';
import { Field } from './Field';
import { linkNotes } from './Slot';
import { FoeHand, Hand } from './Hand';
import { Spinner } from './icons';
import { GameIcon } from '../../ui/icons';
import { PhaseBar } from './PhaseBar';
import { DuelMenu } from './DuelMenu';
import './duel.css';
import { DEFAULT_AVATAR } from '../../story/profile';
import { FIELD_SEQ, fieldBackdrop, type FieldPlayed } from './fieldArt';

export type { Duelist } from './Plate';

/** Fase de batalha (todos os sub-passos): o alvo escolhido depois de "Atacar" é o de ataque. */
const BATTLE = OcgPhase.BATTLE_START | OcgPhase.BATTLE_STEP | OcgPhase.DAMAGE | OcgPhase.DAMAGE_CAL | OcgPhase.BATTLE;
const isBattle = (phase: number) => (phase & BATTLE) !== 0;
/** Linhas de evento que começam assim são separadores (ex.: troca de turno) e não vão para o narrador. */
const SEPARATOR = '—';

/** O resumo do fim do duelo, do ponto de vista do jogador (para as recompensas da campanha). */
export interface DuelSummary { result: 'win' | 'lose' | 'draw' | 'forfeit'; turns: number; lifePoints: number }

export function DuelScreen({ cards, mine, foe: foeDeck, opponent, cpu, player = { id: DEFAULT_AVATAR, name: 'Você' }, settings = DEFAULT_SETTINGS, onSettings = () => {}, rewardFor, onEnd }: {
  cards: Cards; mine: DeckList; foe: DeckList; opponent: Duelist; player?: Duelist;
  /** Perfil da CPU: `chefe` para o chefe do tier (pensa mais e vê o que o jogador esconde). */
  cpu?: CpuKind;
  /** Preferências do jogador (animações, som) e como salvá-las. */
  settings?: Settings; onSettings?: (s: Settings) => void;
  /** O que o duelo rendeu, calculado uma vez quando ele acaba (mostrado no encerramento). */
  rewardFor?: (summary: DuelSummary) => OutroReward | null;
  onEnd: (summary: DuelSummary) => void;
}) {
  const [log, setLog] = useState<string[]>([]);
  const [sel, setSel] = useState<number[]>([]);
  const [sheet, setSheet] = useState<{ code: number; ref: CardRef } | null>(null);
  const [graveOf, setGraveOf] = useState<0 | 1 | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [evText, setEvText] = useState('');
  /** A última Magia de Campo ativada (a arte dela pinta o tapete). */
  const [fieldPlayed, setFieldPlayed] = useState<FieldPlayed | null>(null);
  /** A carta que age: a última que o jogador mandou agir (ou a última ativada). `attack` quando foi "Atacar". */
  const [actor, setActor] = useState<{ code: number; attack: boolean } | null>(null);
  /** "Atacar" acabou de ser tocado: o próximo pedido é o alvo (com um só alvo possível, ele é escolhido sozinho). */
  const [attackArmed, setAttackArmed] = useState(false);

  const name = (code: number) => cards[String(code)]?.name ?? `#${code}`;
  const pushEvents = (ev: string[]) => {
    if (!ev.length) return;
    setLog((l) => [...l, ...ev]);
    const last = ev.filter((e) => !e.startsWith(SEPARATOR)).slice(-1)[0];
    if (last) setEvText(last);
  };
  const onStep = ({ beat }: Step) => {
    pushEvents(beatText(beat, name));
    if (beat.k === 'activate') setActor({ code: beat.code, attack: false });
    if (beat.k === 'activate' && beat.at.zone === 'szone' && beat.at.seq === FIELD_SEQ) setFieldPlayed({ code: beat.code, p: beat.at.p });
  };

  // Encenação: a fila toca os acontecimentos do motor na tela de duelo (`root`), com os fantasmas numa camada fixa.
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  // Faces das cartas para os fantasmas: o CardFace renderizado uma vez por código e guardado como DOM estático.
  const faces = useRef(new Map<number, HTMLElement>());
  const faceOf = (code: number) => {
    let el = faces.current.get(code);
    if (!el) {
      const host = document.createElement('div');
      const r = createRoot(host);
      flushSync(() => r.render(<CardFace code={code} card={cards[String(code)]} />));
      el = host.firstElementChild as HTMLElement | null ?? undefined;
      r.unmount();
      if (!el) return null;
      faces.current.set(code, el);
    }
    return el.cloneNode(true) as HTMLElement;
  };
  const reducedMotion = useReducedMotion();
  // Sons: seguem a preferência do jogador (o áudio é liberado no primeiro toque, em `main.tsx`).
  useEffect(() => { sfx.enabled = settings.sound; }, [settings.sound]);
  // Abertura: segura a primeira encenação até terminar (ou ser pulada); a moeda cai em quem joga o turno 1.
  const [intro, setIntro] = useState<{ starter: 0 | 1; done: () => void } | null>(null);
  const introSeen = useRef(false);
  const before = (steps: Step[]) => {
    if (introSeen.current) return Promise.resolve();
    introSeen.current = true;
    if (!wantsIntro(settings.anim)) return Promise.resolve();
    const first = steps.find((s) => s.beat.k === 'turn')?.beat;
    const starter = first?.k === 'turn' ? first.p : 0;
    return new Promise<void>((resolve) => setIntro({ starter, done: () => { setIntro(null); resolve(); } }));
  };
  // Cara ou coroa: a escolha do jogador vai do painel até o próximo lance de moeda dele.
  const coinCall = useRef<'heads' | 'tails' | undefined>(undefined);
  const takeCoinCall = () => { const c = coinCall.current; coinCall.current = undefined; return c; };
  const stage = useBeatQueue({ root, layer, speed: settings.anim, reducedMotion, faceOf, before, takeCoinCall });

  const engine = useDuelEngine({
    mine, foe: foeDeck, foeName: opponent.name, cpu, stage: stage.run, cancelStage: stage.cancel,
    onPrompt: () => { setSel([]); setPeek(false); }, onStep, onNotice: (t) => pushEvents([t]), onLog: (line) => setLog((l) => [...l, line]),
  });
  const { board, prompt, ended, fail } = engine;
  // O resumo e a recompensa saem uma vez só, quando o duelo acaba.
  const summary = useMemo<DuelSummary | null>(() => {
    if (!ended || !board) return null;
    const result = ended.surrendered ? 'forfeit' : ended.result === 'win' ? 'win' : ended.result === 'draw' ? 'draw' : 'lose';
    return { result, turns: board.turn, lifePoints: Math.max(0, board.players[0].lp) };
  }, [ended]); // eslint-disable-line react-hooks/exhaustive-deps
  const reward = useMemo(() => (summary && rewardFor ? rewardFor(summary) : null), [summary]); // eslint-disable-line react-hooks/exhaustive-deps
  // No encerramento, a faixa de vitória ou de derrota (o App volta à do lugar ao sair do duelo).
  useEffect(() => { if (ended) music.setTrack(ended.result === 'win' ? 'victory' : 'defeat'); }, [ended]);

  const reply = (response: OcgResponse) => { setSheet(null); engine.reply(response); };
  const choice = useMemo(() => choiceOf(prompt), [prompt]);
  const boardChoice = choice?.mode === 'board' ? choice : null;
  const marks = useMemo(() => choiceMarks(boardChoice, sel), [boardChoice, sel]);
  const hl = useMemo(() => (boardChoice ? marks.glow : highlighted(prompt)), [prompt, boardChoice, marks]);
  // Um só monstro para atacar: o ataque vai direto nele, sem a barra de escolha. Com ataque direto possível, o motor
  // pergunta antes (sim/não) e esse pedido não é uma escolha de carta, então nada é pulado.
  const soleTarget = attackArmed && boardChoice?.type === OcgMessageType.SELECT_CARD && boardChoice.options.length === 1 && boardChoice.min === 1;
  useEffect(() => {
    if (!attackArmed || !prompt) return;
    setAttackArmed(false);
    if (soleTarget && boardChoice) reply(confirmResponse(boardChoice, [0]));
  }, [prompt]); // eslint-disable-line react-hooks/exhaustive-deps
  const panel = useMemo(() => promptPanel(prompt, { name, cards, evText, sel, setSel, reply, autoPass: engine.autoPass, onCoinCall: (c) => { coinCall.current = c; } }), [prompt, sel, cards]);

  const side = useMemo(() => {
    const acts = sideActions(prompt);
    if (acts.length) return acts.map((a) => <button key={a.label} className={a.size === 'big' ? 'side-big' : 'side-sm'} onClick={() => reply(a.response)}>{a.label}</button>);
    if (!prompt && !ended) return <div className="side-big wait"><Spinner /></div>; // aguardando o oponente/motor
    return null;
  }, [prompt, ended]);

  const tap = (code: number, ref: CardRef, hidden: boolean) => {
    if (stage.staging) return; // durante a encenação, nenhuma folha abre
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
  const sheetActions = sheet ? cardActions(prompt, sheet.ref).map((a) => ({ label: a.label, primary: a.primary, icon: iconFor(a.label), onClick: () => { setActor({ code: sheet.code, attack: a.label === 'Atacar' }); setAttackArmed(a.label === 'Atacar'); reply(a.response); } })) : [];

  const dbgBox = debugOn ? <div className="dbg">worker: última resposta há {engine.lastPongAgo()} s{engine.dbg.map((l, i) => <div key={i}>{l}</div>)}</div> : null;
  const introLayer = intro && <Intro me={player} foe={opponent} starter={intro.starter} reduced={reducedMotion} onDone={intro.done} />;
  if (!board) return <div className="duel hexbg"><div className="stats">Carregando motor…</div>{dbgBox}{fail && <p className="errtext">{fail}</p>}{introLayer}</div>;
  const [me, foe] = board.players;
  const selHand = sheet && sheet.ref.location === OcgLocation.HAND && sheet.ref.controller === 0 ? sheet.ref.sequence : -1;
  // Escondido (e não desmontado) enquanto se olha o campo: o painel guarda o que estava marcado ou ordenado.
  const panelHidden = !!sheet || peek || !!stage.splash;
  const isChain = prompt?.type === OcgMessageType.SELECT_CHAIN;
  const myTurn = board.turnPlayer === 0;
  const phasebar = <PhaseBar turn={board.turn} phase={board.phase} narration={evText || `Turno ${board.turn}: ${myTurn ? player.name : opponent.name}`} />;

  // A carta aberta na folha: as ligadas a ela (equipamento, alvo) brilham no campo e a folha diz quais são.
  const sheetCard = sheet && (sheet.ref.location === OcgLocation.MZONE || sheet.ref.location === OcgLocation.SZONE)
    ? board.players[sheet.ref.controller as 0 | 1][sheet.ref.location === OcgLocation.MZONE ? 'mzone' : 'szone'][sheet.ref.sequence] : null;
  const rel = new Set((sheetCard?.links ?? []).map((l) => refKey({ controller: l.controller, location: l.location, sequence: l.sequence })));
  const notes = sheet ? linkNotes(sheetCard, name, sheet.ref.controller === 0) : [];
  const pickAttack = !!boardChoice && !!actor?.attack && isBattle(board.phase);
  return (
    <div ref={root} className={`duel hexbg${pickAttack ? ' pick-attack' : ''}${stage.staging ? ' staging' : ''}`}>
      <div className="foebar">
        {!ended && <DuelMenu onSurrender={engine.surrender} settings={settings} onSettings={onSettings} />}
        <Plate side="foe" who={opponent} lp={foe.lp} deck={foe.deck} hand={foe.hand.length} grave={foe.grave} turn={!myTurn} onGrave={() => setGraveOf(1)} cards={cards} />
      </div>
      <FoeHand count={foe.hand.length} />
      <Field board={board} cards={cards} hl={hl} picked={marks.picked} rel={rel} onTap={tap} center={phasebar} backdrop={fieldBackdrop(board, fieldPlayed)} />
      <div className="mybar">
        <Plate side="me" who={player} lp={me.lp} deck={me.deck} hand={me.hand.length} grave={me.grave} turn={myTurn} onGrave={() => setGraveOf(0)} cards={cards} />
        <div className="sidebtns">{side}</div>
      </div>
      <div className="spacer" />
      <Hand hand={me.hand} cards={cards} hl={hl} picked={marks.picked} selected={selHand} onTap={tap} />
      {/* Durante a encenação, um toque em qualquer lugar acelera (e nada embaixo recebe o toque). */}
      {stage.staging && <button className="stagecatch" aria-label="Acelerar" onClick={stage.hurry} />}
      {createPortal(<div ref={layer} className="fxlayer" aria-hidden="true" />, document.body)}
      <ChainStack chain={stage.chain} cards={cards} />
      {stage.toss && <Toss key={stage.toss.key} t={stage.toss} who={(p) => (p === 0 ? player.name : opponent.name)} />}
      {stage.splash && <Splash key={stage.splash.key} s={stage.splash} cards={cards} who={(p) => (p === 0 ? player.name : opponent.name)} />}
      {debugOn && <div className="stats" style={{ textAlign: 'center' }}>{engine.info} · <button style={{ all: 'unset', textDecoration: 'underline' }} onClick={() => setLogOpen(true)}>histórico</button></div>}
      {!debugOn && <button className="logbtn" aria-label="Histórico" onClick={() => setLogOpen(true)}><GameIcon name="history" size={18} /></button>}

      {panel && (
        <div className={`scrim uphand${panelHidden ? ' gone' : ''}`} aria-hidden={panelHidden}>
          <div className="sheet hud panel">
            {panel}
            <button className="hud-btn wide" onClick={() => setPeek(true)}>{ICONS.eye}<span>Ver campo</span></button>
          </div>
        </div>
      )}
      {boardChoice && !soleTarget && !sheet && !stage.splash && <ChoiceBar c={boardChoice} sel={sel} cards={cards} actor={actor?.code ?? null} attack={pickAttack} reply={reply} />}
      {panel && peek && !sheet && (
        <div className="peekbar hud panel">
          <span>{ICONS.eye}Só olhando: toque numa carta para ampliar</span>
          <button className="hud-btn primary" onClick={() => setPeek(false)}>{isChain ? 'Voltar à resposta' : 'Voltar à escolha'}</button>
        </div>
      )}
      {sheet && !stage.splash && <CardSheet code={sheet.code} cards={cards} actions={sheetActions} notes={notes} aboveHand onClose={() => setSheet(null)} />}
      {graveOf !== null && (
        <div className="scrim center">
          <Backdrop onClose={() => setGraveOf(null)} />
          <div className="sheet hud">
            <h4>Cemitério de {graveOf === 0 ? player.name : opponent.name}</h4>
            {board.players[graveOf].grave.length === 0 ? <span className="stats">vazio</span>
              : <div className="grid">{board.players[graveOf].grave.map((c, i) => <button key={i} type="button" aria-label={name(c.code)} onClick={() => { setGraveOf(null); setSheet({ code: c.code, ref: { controller: graveOf, location: OcgLocation.GRAVE, sequence: i } }); }}><CardFace code={c.code} card={cards[String(c.code)]} /></button>)}</div>}
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
      {introLayer}
      {ended && summary && <Outro result={ended.result} detail={ended.text} me={player} foe={opponent} reward={reward} reduced={reducedMotion} onContinue={() => onEnd(summary)} cards={cards} />}
    </div>
  );
}
