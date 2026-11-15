import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  OcgLocation, OcgMessageType, OcgResponseType, SelectBattleCMDAction, SelectIdleCMDAction,
  type OcgMessage, type OcgResponse,
} from 'ocgcore-wasm';
import type { Board, BoardCard, FromWorker, ToWorker } from '../engine/protocol';
import { freePlaces } from '../engine/cpu';
import type { Cards } from '../data/cards';
import { isMonster } from '../data/labels';
import { Backdrop, CardSheet, art } from '../components/CardSheet';
import type { DeckList } from '../engine/session';
import { LOSS_COINS, WIN_COINS } from '../game/economy';

const BASE = import.meta.env.BASE_URL;
const avatar = (id: string) => `${BASE}characters/${id}/neutral.webp`;
const LOC: Record<number, string> = { [OcgLocation.HAND]: 'mão', [OcgLocation.MZONE]: 'campo', [OcgLocation.SZONE]: 'M/A', [OcgLocation.GRAVE]: 'cemitério', [OcgLocation.DECK]: 'deck' };

export interface Duelist { id: string; name: string }
interface CardRef { controller: 0 | 1; location: number; sequence: number }
interface CardAction { label: string; response: OcgResponse; primary?: boolean }
const key = (c: number, l: number, s: number) => `${c}:${l}:${s}`;
const same = (x: CardRef, c: number, l: number, s: number) => x.controller === c && x.location === l && x.sequence === s;

/** Ações que o prompt atual oferece para uma carta específica. */
function cardActions(m: OcgMessage | null, c: number, l: number, s: number): CardAction[] {
  const out: CardAction[] = [];
  if (!m) return out;
  if (m.type === OcgMessageType.SELECT_IDLECMD) {
    const I = (action: SelectIdleCMDAction, index: number): OcgResponse => ({ type: OcgResponseType.SELECT_IDLECMD, action, index });
    m.summons.forEach((x, i) => same(x, c, l, s) && out.push({ label: 'Invocar', response: I(SelectIdleCMDAction.SELECT_SUMMON, i), primary: true }));
    m.special_summons.forEach((x, i) => same(x, c, l, s) && out.push({ label: 'Invocar por efeito', response: I(SelectIdleCMDAction.SELECT_SPECIAL_SUMMON, i) }));
    m.monster_sets.forEach((x, i) => same(x, c, l, s) && out.push({ label: 'Baixar', response: I(SelectIdleCMDAction.SELECT_MONSTER_SET, i) }));
    m.spell_sets.forEach((x, i) => same(x, c, l, s) && out.push({ label: 'Baixar', response: I(SelectIdleCMDAction.SELECT_SPELL_SET, i) }));
    m.pos_changes.forEach((x, i) => same(x, c, l, s) && out.push({ label: 'Mudar posição', response: I(SelectIdleCMDAction.SELECT_POS_CHANGE, i) }));
    m.activates.forEach((x, i) => same(x, c, l, s) && out.push({ label: 'Ativar', response: I(SelectIdleCMDAction.SELECT_ACTIVATE, i), primary: true }));
  } else if (m.type === OcgMessageType.SELECT_BATTLECMD) {
    const B = (action: SelectBattleCMDAction, index: number): OcgResponse => ({ type: OcgResponseType.SELECT_BATTLECMD, action, index });
    m.attacks.forEach((x, i) => same(x, c, l, s) && out.push({ label: x.can_direct ? 'Ataque direto' : 'Atacar', response: B(SelectBattleCMDAction.SELECT_BATTLE, i), primary: true }));
    m.chains.forEach((x, i) => same(x, c, l, s) && out.push({ label: 'Ativar', response: B(SelectBattleCMDAction.SELECT_CHAIN, i) }));
  } else if (m.type === OcgMessageType.SELECT_CHAIN) {
    m.selects.forEach((x, i) => same(x, c, l, s) && out.push({ label: 'Ativar', response: { type: OcgResponseType.SELECT_CHAIN, index: i }, primary: true }));
  }
  return out;
}

function highlighted(m: OcgMessage | null): Set<string> {
  const set = new Set<string>();
  const add = (xs: CardRef[]) => xs.forEach((x) => set.add(key(x.controller, x.location, x.sequence)));
  if (m?.type === OcgMessageType.SELECT_IDLECMD) { add(m.summons); add(m.special_summons); add(m.monster_sets); add(m.spell_sets); add(m.pos_changes); add(m.activates); }
  else if (m?.type === OcgMessageType.SELECT_BATTLECMD) { add(m.attacks); add(m.chains); }
  else if (m?.type === OcgMessageType.SELECT_CHAIN) add(m.selects);
  return set;
}

const PHASES: [string, number][] = [['DP', 1], ['SP', 2], ['M1', 4], ['BP', 8 | 16 | 32 | 64 | 128], ['M2', 256], ['EP', 512]];

function Slot({ c, cards, cref, foe, hl, onTap, style }: {
  c: BoardCard | null; cards: Cards; cref: CardRef; foe?: boolean; hl?: boolean;
  onTap: (code: number, ref: CardRef, hidden: boolean) => void; style?: React.CSSProperties;
}) {
  if (!c) return <div className="slot empty" style={style} />;
  const inHand = cref.location === OcgLocation.HAND;
  const facedown = !inHand && (c.position & 10) !== 0;
  const def = !inHand && (c.position & 12) !== 0;
  const info = cards[String(c.code)];
  const hidden = !!foe && (facedown || inHand);
  const showStats = !facedown && !inHand && c.attack != null && !!info && isMonster(info.type);
  return (
    <button className={`slot${def ? ' def' : ''}${facedown ? ' down' : ''}${hl ? ' hl' : ''}`} style={style} disabled={hidden} onClick={() => onTap(c.code, cref, hidden)}>
      {hidden ? <div className="cardback" /> : <img src={art(c.code, 'small')} alt={info?.name ?? ''} draggable={false} />}
      {showStats && <i>{c.attack}/{c.defense}</i>}
    </button>
  );
}

function Plate({ side, who, lp, deck, hand, grave, onGrave }: { side: 'me' | 'foe'; who: Duelist; lp: number; deck: number; hand: number; grave: number; onGrave: () => void }) {
  return (
    <div className={`plate hud ${side}`}>
      <img className="av" src={avatar(who.id)} alt="" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
      <div className="info">
        <div className="nm">{who.name}</div>
        <div className="lpn">LP {lp}</div>
        <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, (lp / 8000) * 100))}%` }} /></div>
      </div>
      <div className="counts"><span>▤ {deck}</span><span>✋ {hand}</span><button onClick={onGrave}>⚰ {grave}</button></div>
    </div>
  );
}

export function DuelScreen({ cards, mine, foe: foeDeck, opponent, player = { id: 'yugi_muto', name: 'Você' }, onEnd }: { cards: Cards; mine: DeckList; foe: DeckList; opponent: Duelist; player?: Duelist; onEnd: (won: boolean) => void }) {
  const worker = useRef<Worker | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [prompt, setPrompt] = useState<OcgMessage | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [toast, setToast] = useState<{ n: number; text: string } | null>(null);
  const [info, setInfo] = useState('');
  const [ended, setEnded] = useState<{ text: string; won: boolean } | null>(null);
  const [sel, setSel] = useState<number[]>([]);
  const [sheet, setSheet] = useState<{ code: number; ref: CardRef } | null>(null);
  const [graveOf, setGraveOf] = useState<0 | 1 | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const debugOn = typeof location !== 'undefined' && location.search.includes('debug');
  const [dbg, setDbg] = useState<string[]>([]);
  const pong = useRef(0);
  const [, tick] = useState(0);
  const watchdog = useRef<number | undefined>(undefined);
  const clearDog = () => { window.clearTimeout(watchdog.current); watchdog.current = undefined; };

  const name = (code: number) => cards[String(code)]?.name ?? `#${code}`;
  const send = (m: ToWorker) => worker.current?.postMessage(m);
  const pushEvents = (ev: string[]) => {
    if (!ev.length) return;
    setLog((l) => [...l, ...ev]);
    setToast((t) => ({ n: (t?.n ?? 0) + 1, text: ev.filter((e) => !e.startsWith('—')).slice(-2).join(' · ') || ev[ev.length - 1] }));
  };

  const start = () => {
    worker.current?.terminate();
    const w = new Worker(new URL('../engine/worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    w.onerror = (e) => { clearDog(); setFail(`Erro no motor: ${e.message || 'falha ao carregar o worker'}`); };
    w.onmessageerror = () => { clearDog(); setFail('Erro ao ler a resposta do motor.'); };
    w.onmessage = (ev: MessageEvent<FromWorker>) => {
      const d = ev.data;
      if (d.t === 'pong') { pong.current = Date.now(); return; }
      if (d.t === 'debug') { setDbg((l) => [...l.slice(-14), `${new Date().toISOString().slice(17, 23)} ${d.text}`]); return; }
      clearDog();
      if (d.t === 'ready') setInfo(`ocgcore ${d.version.join('.')} · ${d.loadMs} ms`);
      else if (d.t === 'prompt') { setBoard(d.board); setPrompt(d.msg); setSel([]); pushEvents(d.events); }
      else if (d.t === 'end') {
        setBoard(d.board); setPrompt(null); pushEvents(d.events);
        setEnded({ text: d.winner === 0 ? 'Você venceu!' : `${opponent.name} venceu.`, won: d.winner === 0 });
      } else if (d.t === 'error') { setLog((l) => [...l, `ERRO: ${d.text}`]); setFail(d.text); }
    };
    send({ t: 'start', seed: Date.now() % 100000, mine, foe: foeDeck, base: BASE, debug: debugOn });
    pong.current = Date.now();
  };

  // Diagnóstico (?debug): pinga o worker a cada 2 s para saber se ele está vivo.
  useEffect(() => {
    if (!debugOn) return;
    let n = 0;
    const id = window.setInterval(() => { send({ t: 'ping', n: n++ }); tick((x) => x + 1); }, 2000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    // Aquece o cache offline com a arte das cartas deste duelo.
    for (const code of new Set([...mine.main, ...mine.extra, ...foeDeck.main, ...foeDeck.extra])) fetch(art(code, 'small')).catch(() => {});
    start();
    return () => { worker.current?.terminate(); };
  }, []);

  const reply = (response: OcgResponse) => {
    setPrompt(null); setSheet(null); send({ t: 'respond', response });
    // Se o motor não devolver nada em 12 s, mostra o problema em vez de deixar a tela parada.
    clearDog();
    watchdog.current = window.setTimeout(() => setFail('O motor não respondeu (12 s sem novo pedido de jogada).'), 12000);
  };
  const hl = useMemo(() => highlighted(prompt), [prompt]);

  /** Painel para prompts que não são "tocar numa carta". */
  const panel = useMemo((): ReactNode => {
    const m = prompt;
    if (!m) return null;
    const btn = (label: string, r: OcgResponse, primary = false) => <button key={label + JSON.stringify(r)} className={`hud-btn ${primary ? 'primary' : ''}`} onClick={() => reply(r)}>{label}</button>;
    const where = (x: { location: number; code: number }) => `${name(x.code)} (${LOC[x.location] ?? ''})`;
    switch (m.type) {
      case OcgMessageType.SELECT_CHAIN:
        return <><h4>Responder em corrente?</h4>{m.selects.map((c, i) => btn(`Ativar ${where(c)}`, { type: OcgResponseType.SELECT_CHAIN, index: i }, true))}{!m.forced && btn('Não', { type: OcgResponseType.SELECT_CHAIN, index: null })}{!m.forced && <button className="hud-btn" onClick={() => { send({ t: 'autoPass', value: true }); reply({ type: OcgResponseType.SELECT_CHAIN, index: null }); }}>Não perguntar mais neste duelo</button>}</>;
      case OcgMessageType.SELECT_YESNO:
      case OcgMessageType.SELECT_EFFECTYN: {
        const t = m.type === OcgMessageType.SELECT_YESNO ? OcgResponseType.SELECT_YESNO : OcgResponseType.SELECT_EFFECTYN;
        return <><h4>{m.type === OcgMessageType.SELECT_EFFECTYN ? `Ativar efeito de ${name(m.code)}?` : 'Confirmar?'}</h4><div className="acts">{btn('Sim', { type: t, yes: true } as OcgResponse, true)}{btn('Não', { type: t, yes: false } as OcgResponse)}</div></>;
      }
      case OcgMessageType.SELECT_OPTION:
        return <><h4>Escolha uma opção</h4>{m.options.map((_, i) => btn(`Opção ${i + 1}`, { type: OcgResponseType.SELECT_OPTION, index: i }))}</>;
      case OcgMessageType.SELECT_POSITION: {
        const opts: [number, string][] = [[1, 'Ataque'], [4, 'Defesa'], [8, 'Defesa (baixada)'], [2, 'Ataque (baixada)']];
        return <><h4>Posição de {name(m.code)}</h4><div className="acts">{opts.filter(([p]) => m.positions & p).map(([p, l]) => btn(l, { type: OcgResponseType.SELECT_POSITION, position: p as never }, p === 1))}</div></>;
      }
      case OcgMessageType.SELECT_PLACE:
      case OcgMessageType.SELECT_DISFIELD:
        return <><h4>Zona escolhida automaticamente</h4>{btn('Confirmar', { type: m.type === OcgMessageType.SELECT_PLACE ? OcgResponseType.SELECT_PLACE : OcgResponseType.SELECT_DISFIELD, places: freePlaces(m.field_mask, m.player, m.count) }, true)}</>;
      case OcgMessageType.SELECT_CARD:
      case OcgMessageType.SELECT_TRIBUTE: {
        const list = m.selects as { code: number; location: number }[];
        // Tributo: cada carta pode valer 1 ou 2; confere a soma, não a quantidade.
        const weight = (i: number) => (m.type === OcgMessageType.SELECT_TRIBUTE ? (m.selects[i] as { release_param?: number }).release_param || 1 : 1);
        const got = sel.reduce((a, i) => a + weight(i), 0);
        const ok = got >= m.min && got <= m.max;
        const t = m.type === OcgMessageType.SELECT_CARD ? OcgResponseType.SELECT_CARD : OcgResponseType.SELECT_TRIBUTE;
        return <>
          <h4>{m.type === OcgMessageType.SELECT_TRIBUTE ? 'Escolha os tributos' : 'Escolha as cartas'} ({m.min}–{m.max})</h4>
          {list.map((c, i) => <button key={i} className={`hud-btn ${sel.includes(i) ? 'on' : ''}`} onClick={() => setSel((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i])}>{where(c)}</button>)}
          <button className="hud-btn primary" disabled={!ok} onClick={() => reply({ type: t, indicies: sel } as OcgResponse)}>Confirmar</button>
          {m.can_cancel && btn('Cancelar', { type: t, indicies: null } as OcgResponse)}
        </>;
      }
      case OcgMessageType.SELECT_UNSELECT_CARD:
        return <><h4>Escolha uma carta</h4>{m.select_cards.map((c, i) => btn(where(c), { type: OcgResponseType.SELECT_UNSELECT_CARD, index: i }))}{m.can_finish && btn('Concluir', { type: OcgResponseType.SELECT_UNSELECT_CARD, index: null }, true)}</>;
      case OcgMessageType.SELECT_IDLECMD:
      case OcgMessageType.SELECT_BATTLECMD:
        return null; // feito pelas cartas e pelos botões laterais
      default:
        return <h4>Prompt ainda não suportado na UI (tipo {m.type})</h4>;
    }
  }, [prompt, sel, cards]);

  const side = useMemo(() => {
    const m = prompt;
    if (m?.type === OcgMessageType.SELECT_IDLECMD)
      return <>
        {m.to_bp && <button className="hud-btn primary" onClick={() => reply({ type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.TO_BP, index: null })}>BATALHA</button>}
        {m.to_ep && <button className="hud-btn" onClick={() => reply({ type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.TO_EP, index: null })}>Encerrar</button>}
      </>;
    if (m?.type === OcgMessageType.SELECT_BATTLECMD)
      return <>
        {m.to_m2 && <button className="hud-btn" onClick={() => reply({ type: OcgResponseType.SELECT_BATTLECMD, action: SelectBattleCMDAction.TO_M2, index: null })}>Main 2</button>}
        {m.to_ep && <button className="hud-btn primary" onClick={() => reply({ type: OcgResponseType.SELECT_BATTLECMD, action: SelectBattleCMDAction.TO_EP, index: null })}>Encerrar</button>}
      </>;
    return null;
  }, [prompt]);

  const tap = (code: number, ref: CardRef, hidden: boolean) => { if (!hidden) setSheet({ code, ref }); };
  const sheetActions = sheet ? cardActions(prompt, sheet.ref.controller, sheet.ref.location, sheet.ref.sequence).map((a) => ({ label: a.label, primary: a.primary, onClick: () => reply(a.response) })) : [];

  const dbgBox = debugOn ? <div className="dbg">worker: última resposta há {Math.round((Date.now() - pong.current) / 1000)} s{dbg.map((l, i) => <div key={i}>{l}</div>)}</div> : null;
  if (!board) return <div className="duel hexbg"><div className="stats">Carregando motor…</div>{dbgBox}{fail && <p className="errtext">{fail}</p>}</div>;
  const [me, foe] = board.players;
  const phase = PHASES.find(([, mask]) => board.phase & mask)?.[0];
  const row = (cs: (BoardCard | null)[], controller: 0 | 1, location: number) => (
    <div className="row">{cs.slice(0, 5).map((c, i) => <Slot key={i} c={c} cards={cards} foe={controller === 1} cref={{ controller, location, sequence: i }} hl={hl.has(key(controller, location, i))} onTap={tap} />)}</div>
  );
  const n = me.hand.length;
  const overlap = n > 4 ? -Math.min(48, (n * 74 - 330) / (n - 1)) : 4;

  return (
    <div className="duel hexbg">
      <Plate side="foe" who={opponent} lp={foe.lp} deck={foe.deck} hand={foe.hand.length} grave={foe.grave.length} onGrave={() => setGraveOf(1)} />
      <div className="foehand">{foe.hand.map((_, i) => <div key={i} className="cardback mini" />)}</div>
      <div className="fieldwrap">
        <div className="field">
          {row(foe.szone, 1, OcgLocation.SZONE)}{row(foe.mzone, 1, OcgLocation.MZONE)}
          <div style={{ height: 34 }} />
          {row(me.mzone, 0, OcgLocation.MZONE)}{row(me.szone, 0, OcgLocation.SZONE)}
        </div>
        <div className="phasebar hud">
          <div className="chips">{PHASES.map(([p]) => <span key={p} className={`chip${p === phase ? ' on' : ''}`}>{p}</span>)}</div>
          <div className="turn">Turno {board.turn}: {board.turnPlayer === 0 ? player.name : opponent.name}</div>
        </div>
      </div>
      <div className="spacer" />
      <Plate side="me" who={player} lp={me.lp} deck={me.deck} hand={me.hand.length} grave={me.grave.length} onGrave={() => setGraveOf(0)} />
      <div className="handfan">
        {me.hand.map((c, i) => {
          const mid = (n - 1) / 2;
          return <Slot key={i} c={c} cards={cards} cref={{ controller: 0, location: OcgLocation.HAND, sequence: i }} hl={hl.has(key(0, OcgLocation.HAND, i))} onTap={tap}
            style={{ marginLeft: i === 0 ? 0 : overlap, transform: `rotate(${(i - mid) * 3.5}deg) translateY(${Math.abs(i - mid) * 3}px)`, zIndex: i }} />;
        })}
      </div>
      {side && <div className="sidebtns">{side}</div>}
      {toast && <div key={toast.n} className="toast">{toast.text}</div>}
      <div className="stats" style={{ textAlign: 'center' }}>{info} · <button style={{ all: 'unset', textDecoration: 'underline' }} onClick={() => setLogOpen(true)}>histórico</button></div>

      {panel && !sheet && <div className="scrim center"><div className="sheet hud">{panel}</div></div>}
      {sheet && <CardSheet code={sheet.code} cards={cards} actions={sheetActions} onClose={() => setSheet(null)} />}
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
          <button className="hud-btn primary" onClick={() => { setFail(null); setBoard(null); setPrompt(null); setLog([]); start(); }}>Reiniciar o duelo</button>
          <button className="hud-btn" onClick={() => setFail(null)}>Fechar</button>
        </div></div>
      )}
      {ended && <div className="scrim center"><div className="sheet hud"><h4>{ended.text}</h4><p className="stats" style={{ margin: 0 }}>+{ended.won ? WIN_COINS : LOSS_COINS} moedas</p><button className="hud-btn gold" onClick={() => onEnd(ended.won)}>Continuar</button></div></div>}
    </div>
  );
}
