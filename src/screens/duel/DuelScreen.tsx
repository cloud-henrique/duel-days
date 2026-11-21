import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { CpuKind } from '../../engine/search';
import { OcgLocation, OcgMessageType, OcgPhase, type OcgResponse } from 'ocgcore-wasm';
import type { Step } from '../../engine/protocol';
import { beatText, locKey, toLoc } from '../../engine/beats';
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
import { PILE_LOCATION, type PileKind } from './Piles';
import { PileSheet } from './PileSheet';
import { linkNotes } from './Slot';
import { FoeHand, Hand } from './Hand';
import { Spinner } from './icons';
import { GameIcon } from '../../ui/icons';
import { PhaseBar } from './PhaseBar';
import { DuelMenu } from './DuelMenu';
import { useHover, useWide } from '../../ui/wide';
import { cardAtLoc, type Focus } from './wide';
import { CardActions, CardPanel, RecentLog } from './WideParts';
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
  /** A pilha com a lista aberta (Cemitério, Banidas ou o Extra Deck do jogador). */
  const [pileOf, setPileOf] = useState<{ p: 0 | 1; kind: PileKind } | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [evText, setEvText] = useState('');
  /** A última Magia de Campo ativada (a arte dela pinta o tapete). */
  const [fieldPlayed, setFieldPlayed] = useState<FieldPlayed | null>(null);
  /** A carta que age: a última que o jogador mandou agir (ou a última ativada). `attack` quando foi "Atacar". */
  const [actor, setActor] = useState<{ code: number; attack: boolean } | null>(null);
  /** "Atacar" acabou de ser tocado: o próximo pedido é o alvo (com um só alvo possível, ele é escolhido sozinho). */
  const [attackArmed, setAttackArmed] = useState(false);
  // Tela larga (change layout-desktop): outra composição, painel fixo da carta e hover com mouse.
  const wide = useWide();
  const hoverable = useHover() && wide;
  /** A carta sob o ponteiro (só tela larga com mouse); a fixada continua em `sheet`. */
  const [hover, setHover] = useState<Focus | null>(null);
  useEffect(() => { if (!hoverable) setHover(null); }, [hoverable]);
  // Esc solta a carta fixada (tela larga).
  useEffect(() => {
    if (!wide) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wide]);

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
    mine, foe: foeDeck, foeName: opponent.name, cpu, autoPass: settings.chain === 'skip', stage: stage.run, cancelStage: stage.cancel,
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
  const panel = useMemo(() => promptPanel(prompt, { name, cards, evText, sel, setSel, reply, autoPass: () => onSettings({ ...settings, chain: 'skip' }), onCoinCall: (c) => { coinCall.current = c; } }), [prompt, sel, cards, settings]);

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
  // Na tela larga, a carta em foco é a do ponteiro (hover) ou, sem ele, a fixada; no retrato, a da folha.
  const focus = wide ? hover ?? sheet : sheet;
  const sheetCard = focus && (focus.ref.location === OcgLocation.MZONE || focus.ref.location === OcgLocation.SZONE)
    ? board.players[focus.ref.controller as 0 | 1][focus.ref.location === OcgLocation.MZONE ? 'mzone' : 'szone'][focus.ref.sequence] : null;
  const rel = new Set((sheetCard?.links ?? []).map((l) => refKey({ controller: l.controller, location: l.location, sequence: l.sequence })));
  const notes = focus ? linkNotes(sheetCard, name, focus.ref.controller === 0) : [];
  // Hover (tela larga com mouse): a carta visível sob o ponteiro, achada pelo `data-loc` do elemento.
  const onOver = (e: ReactPointerEvent) => {
    const el = (e.target as Element).closest?.('[data-loc]');
    const f = el ? cardAtLoc(board, el.getAttribute('data-loc') ?? '') : null;
    setHover((h) => (h === f || (h && f && h.code === f.code && refKey(h.ref) === refKey(f.ref)) ? h : f));
  };
  const pickAttack = !!boardChoice && !!actor?.attack && isBattle(board.phase);
  // Peças comuns aos dois layouts (retrato e tela larga): os mesmos componentes, em lugares diferentes.
  const menuEl = !ended && <DuelMenu onSurrender={engine.surrender} settings={settings} onSettings={onSettings} host={root} />;
  const foePlate = <Plate side="foe" who={opponent} lp={foe.lp} hand={foe.hand.length} turn={!myTurn} />;
  const mePlate = <Plate side="me" who={player} lp={me.lp} hand={me.hand.length} turn={myTurn} />;
  const fieldEl = <Field board={board} cards={cards} hl={hl} picked={marks.picked} rel={rel} onTap={tap} onOpenPile={(p, kind) => { if (!stage.staging && !(kind === 'extra' && p === 1)) setPileOf({ p, kind }); }} center={phasebar} backdrop={fieldBackdrop(board, fieldPlayed)} />;
  const handEl = <Hand hand={me.hand} cards={cards} hl={hl} picked={marks.picked} selected={selHand} onTap={tap} />;
  const sideEl = <div className="sidebtns">{side}</div>;
  const choiceBar = (c: NonNullable<typeof boardChoice>) => <ChoiceBar c={c} sel={sel} cards={cards} actor={actor?.code ?? null} attack={pickAttack} reply={reply} />;
  const cls = `duel hexbg${wide ? ' wide' : ''}${pickAttack ? ' pick-attack' : ''}${stage.staging ? ' staging' : ''}`;
  // Por cima dos dois layouts: encenação, listas, histórico, erros, abertura e encerramento.
  const overlays = (
    <>
      {/* Durante a encenação, um toque em qualquer lugar acelera (e nada embaixo recebe o toque). */}
      {stage.staging && <button className="stagecatch" aria-label="Acelerar" onClick={stage.hurry} />}
      {createPortal(<div ref={layer} className="fxlayer" aria-hidden="true" />, document.body)}
      <ChainStack chain={stage.chain} cards={cards} />
      {stage.toss && <Toss key={stage.toss.key} t={stage.toss} who={(p) => (p === 0 ? player.name : opponent.name)} />}
      {stage.splash && <Splash key={stage.splash.key} s={stage.splash} cards={cards} who={(p) => (p === 0 ? player.name : opponent.name)} />}
      {debugOn && <div className="stats" style={{ textAlign: 'center' }}>{engine.info} · <button style={{ all: 'unset', textDecoration: 'underline' }} onClick={() => setLogOpen(true)}>histórico</button></div>}
      {pileOf && (
        <PileSheet p={pileOf.p} kind={pileOf.kind} list={board.players[pileOf.p][pileOf.kind]} whose={pileOf.p === 0 ? player.name : opponent.name} cards={cards}
          onClose={() => setPileOf(null)}
          onPick={(code, i) => { const at = pileOf; setPileOf(null); setSheet({ code, ref: { controller: at.p, location: PILE_LOCATION[at.kind], sequence: i } }); }} />
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
    </>
  );

  if (wide) {
    // Tela larga (change layout-desktop): jogadores à esquerda, campo e mão no centro, carta e pedidos à direita. Nada
    // cobre o campo: a carta fica no painel, as ações sobre ela e os pedidos na coluna direita.
    const showActs = !!sheet && sheetActions.length > 0 && !stage.staging && !stage.splash && !pileOf && !logOpen && !ended;
    const choosing = !!boardChoice && !soleTarget && !stage.splash;
    return (
      <div ref={root} className={cls} onPointerOver={hoverable ? onOver : undefined} onPointerLeave={hoverable ? () => setHover(null) : undefined}>
        <aside className="wleft">
          <div className="foebar">{menuEl}{foePlate}</div>
          <RecentLog log={log} onOpen={() => setLogOpen(true)} />
          <div className="mybar">{mePlate}</div>
        </aside>
        <div className="wcenter">
          <FoeHand count={foe.hand.length} />
          {fieldEl}
          {handEl}
        </div>
        <aside className="wright">
          <CardPanel code={focus?.code ?? null} cards={cards} notes={notes} compact={!!panel || choosing} hover={hoverable} />
          {panel && <div className={`sheet hud panel wpanel${stage.splash ? ' gone' : ''}`} aria-hidden={!!stage.splash}>{panel}</div>}
          {choosing && boardChoice && choiceBar(boardChoice)}
          {sideEl}
        </aside>
        {showActs && sheet && <CardActions root={root} loc={locKey(toLoc(sheet.ref))} actions={sheetActions} watch={board} onLost={() => setSheet(null)} />}
        {overlays}
      </div>
    );
  }
  return (
    <div ref={root} className={cls}>
      <div className="foebar">{menuEl}{foePlate}</div>
      <FoeHand count={foe.hand.length} />
      {fieldEl}
      <div className="mybar">{mePlate}{sideEl}</div>
      <div className="spacer" />
      {handEl}
      {!debugOn && <button className="logbtn" aria-label="Histórico" onClick={() => setLogOpen(true)}><GameIcon name="history" size={18} /></button>}
      {panel && (
        <div className={`scrim uphand${panelHidden ? ' gone' : ''}`} aria-hidden={panelHidden}>
          <div className="sheet hud panel">
            {panel}
            <button className="hud-btn wide" onClick={() => setPeek(true)}>{ICONS.eye}<span>Ver campo</span></button>
          </div>
        </div>
      )}
      {boardChoice && !soleTarget && !sheet && !stage.splash && choiceBar(boardChoice)}
      {panel && peek && !sheet && (
        <div className="peekbar hud panel">
          <span>{ICONS.eye}Só olhando: toque numa carta para ampliar</span>
          <button className="hud-btn primary" onClick={() => setPeek(false)}>{isChain ? 'Voltar à resposta' : 'Voltar à escolha'}</button>
        </div>
      )}
      {sheet && !stage.splash && <CardSheet code={sheet.code} cards={cards} actions={sheetActions} notes={notes} aboveHand onClose={() => setSheet(null)} />}
      {overlays}
    </div>
  );
}
