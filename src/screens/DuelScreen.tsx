import { useEffect, useMemo, useRef, useState } from 'react';
import { OcgLocation, OcgMessageType, OcgResponseType, SelectBattleCMDAction, SelectIdleCMDAction, type OcgMessage, type OcgResponse } from 'ocgcore-wasm';
import type { Board, BoardCard, FromWorker, ToWorker } from '../engine/protocol';
import type { CardRecord } from '../engine/session';
import { freePlaces } from '../engine/cpu';

const BASE = import.meta.env.BASE_URL;
type Cards = Record<string, CardRecord>;
const LOC: Record<number, string> = { [OcgLocation.HAND]: 'mão', [OcgLocation.MZONE]: 'campo', [OcgLocation.SZONE]: 'M/A', [OcgLocation.GRAVE]: 'cemitério', [OcgLocation.DECK]: 'deck' };

const art = (code: number, size: 'small' | 'large') => `${BASE}cards/${size}/${code}.webp`;

/** Uma carta: arte real, verso para cartas ocultas do oponente, giro em defesa. Toque abre o zoom. */
function Slot({ c, cards, foe, inHand, onZoom }: { c: BoardCard | null; cards: Cards; foe?: boolean; inHand?: boolean; onZoom: (code: number) => void }) {
  if (!c) return <div className="slot empty" />;
  const facedown = !inHand && (c.position & 10) !== 0;
  const def = !inHand && (c.position & 12) !== 0;
  const info = cards[String(c.code)];
  const hidden = foe && facedown;
  const showStats = !facedown && c.attack != null && !!info && info.attack + info.defense > 0;
  return (
    <button className={`slot${def ? ' def' : ''}${facedown ? ' down' : ''}`} disabled={hidden} onClick={() => onZoom(c.code)} title={hidden ? '' : info?.name}>
      {hidden ? <div className="cardback" /> : <img src={art(c.code, 'small')} alt={info?.name ?? ''} draggable={false} />}
      {showStats && <i>{c.attack}/{c.defense}</i>}
    </button>
  );
}

function BoardView({ b, cards, opponent, onZoom }: { b: Board; cards: Cards; opponent: string; onZoom: (code: number) => void }) {
  const [me, foe] = b.players;
  const row = (cs: (BoardCard | null)[], isFoe?: boolean) => <div className="row">{cs.slice(0, 5).map((c, i) => <Slot key={i} c={c} cards={cards} foe={isFoe} onZoom={onZoom} />)}</div>;
  return (
    <>
      <div className="lp"><span className="foe">{opponent} {foe.lp}</span><span className="stats">Turno {b.turn} · {b.turnPlayer === 0 ? 'seu' : 'do oponente'}</span><span className="me">Você {me.lp}</span></div>
      <div className="meta"><span>{opponent}: mão {foe.hand.length} · deck {foe.deck} · cem. {foe.grave.length}</span></div>
      {row(foe.szone, true)}{row(foe.mzone, true)}{row(me.mzone)}{row(me.szone)}
      <div className="meta"><span>Você: deck {me.deck} · cem. {me.grave.length}</span></div>
      <div className="hand">{me.hand.map((c, i) => <Slot key={i} c={c} cards={cards} inHand onZoom={onZoom} />)}</div>
    </>
  );
}

function ZoomCard({ code, cards, onClose }: { code: number; cards: Cards; onClose: () => void }) {
  const info = cards[String(code)];
  return (
    <div className="zoom" onClick={onClose}>
      <img src={art(code, 'large')} alt={info?.name ?? ''} draggable={false} />
      <div className="zoomtext">
        <b>{info?.name}</b>
        <p>{info?.desc}</p>
        <span className="stats">toque para fechar</span>
      </div>
    </div>
  );
}

export function DuelScreen({ opponent, onEnd }: { opponent: string; onEnd: (won: boolean) => void }) {
  const worker = useRef<Worker | null>(null);
  const [cards, setCards] = useState<Cards>({});
  const [board, setBoard] = useState<Board | null>(null);
  const [prompt, setPrompt] = useState<OcgMessage | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [info, setInfo] = useState('');
  const [ended, setEnded] = useState<{ text: string; won: boolean } | null>(null);
  const [sel, setSel] = useState<number[]>([]);
  const [zoom, setZoom] = useState<number | null>(null);
  const logEnd = useRef<HTMLDivElement>(null);

  const name = (code: number) => cards[String(code)]?.name ?? `#${code}`;
  const send = (m: ToWorker) => worker.current?.postMessage(m);

  const start = (cs: Cards) => {
    worker.current?.terminate();
    const w = new Worker(new URL('../engine/worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    w.onmessage = (ev: MessageEvent<FromWorker>) => {
      const d = ev.data;
      if (d.t === 'ready') setInfo(`ocgcore ${d.version.join('.')} · pronto em ${d.loadMs} ms`);
      else if (d.t === 'prompt') { setBoard(d.board); setPrompt(d.msg); setSel([]); setLog((l) => [...l, ...d.events]); }
      else if (d.t === 'end') { setBoard(d.board); setPrompt(null); setEnded({ text: d.winner === 0 ? 'Você venceu!' : `${opponent} venceu.`, won: d.winner === 0 }); setLog((l) => [...l, ...d.events]); }
      else if (d.t === 'error') setLog((l) => [...l, `ERRO: ${d.text}`]);
    };
    const pool = Object.keys(cs).map(Number);
    const deck = Array.from({ length: 40 }, (_, i) => pool[i % pool.length]);
    setLog([]); setEnded(null); setBoard(null); setPrompt(null);
    send({ t: 'start', seed: Date.now() % 100000, deck, base: BASE });
  };

  useEffect(() => {
    fetch(`${BASE}data/cards.json`).then((r) => r.json()).then((cs: Cards) => { setCards(cs); start(cs); });
    return () => { worker.current?.terminate(); };
  }, []);
  useEffect(() => { logEnd.current?.scrollIntoView(); }, [log]);

  const reply = (response: OcgResponse) => { setPrompt(null); send({ t: 'respond', response }); };
  const actions = useMemo(() => {
    const m = prompt;
    if (!m) return null;
    const btn = (label: string, r: OcgResponse, primary = false) => <button key={label + JSON.stringify(r)} className={primary ? 'primary' : ''} onClick={() => reply(r)}>{label}</button>;
    const where = (x: { location: number; code: number }) => `${name(x.code)} (${LOC[x.location] ?? ''})`;
    switch (m.type) {
      case OcgMessageType.SELECT_IDLECMD: {
        const I = (action: SelectIdleCMDAction, index: number | null): OcgResponse => ({ type: OcgResponseType.SELECT_IDLECMD, action, index });
        return <>
          <h4>Sua jogada</h4>
          {m.summons.map((c, i) => btn(`Invocar ${where(c)}`, I(SelectIdleCMDAction.SELECT_SUMMON, i)))}
          {m.special_summons.map((c, i) => btn(`Invocar por efeito ${where(c)}`, I(SelectIdleCMDAction.SELECT_SPECIAL_SUMMON, i)))}
          {m.monster_sets.map((c, i) => btn(`Baixar ${where(c)}`, I(SelectIdleCMDAction.SELECT_MONSTER_SET, i)))}
          {m.spell_sets.map((c, i) => btn(`Baixar M/A ${where(c)}`, I(SelectIdleCMDAction.SELECT_SPELL_SET, i)))}
          {m.pos_changes.map((c, i) => btn(`Mudar posição ${where(c)}`, I(SelectIdleCMDAction.SELECT_POS_CHANGE, i)))}
          {m.activates.map((c, i) => btn(`Ativar ${where(c)}`, I(SelectIdleCMDAction.SELECT_ACTIVATE, i)))}
          {m.to_bp && btn('Ir para a batalha', I(SelectIdleCMDAction.TO_BP, null), true)}
          {m.to_ep && btn('Encerrar turno', I(SelectIdleCMDAction.TO_EP, null), !m.to_bp)}
        </>;
      }
      case OcgMessageType.SELECT_BATTLECMD: {
        const B = (action: SelectBattleCMDAction, index: number | null): OcgResponse => ({ type: OcgResponseType.SELECT_BATTLECMD, action, index });
        return <>
          <h4>Batalha</h4>
          {m.attacks.map((c, i) => btn(`Atacar com ${where(c)}${c.can_direct ? ' (direto)' : ''}`, B(SelectBattleCMDAction.SELECT_BATTLE, i)))}
          {m.chains.map((c, i) => btn(`Ativar ${where(c)}`, B(SelectBattleCMDAction.SELECT_CHAIN, i)))}
          {m.to_m2 && btn('Ir para a Main 2', B(SelectBattleCMDAction.TO_M2, null))}
          {m.to_ep && btn('Encerrar turno', B(SelectBattleCMDAction.TO_EP, null), true)}
        </>;
      }
      case OcgMessageType.SELECT_CHAIN:
        return <>
          <h4>Responder em corrente?</h4>
          {m.selects.map((c, i) => btn(`Ativar ${where(c)}`, { type: OcgResponseType.SELECT_CHAIN, index: i }))}
          {!m.forced && btn('Não', { type: OcgResponseType.SELECT_CHAIN, index: null }, true)}
        </>;
      case OcgMessageType.SELECT_YESNO:
      case OcgMessageType.SELECT_EFFECTYN: {
        const t = m.type === OcgMessageType.SELECT_YESNO ? OcgResponseType.SELECT_YESNO : OcgResponseType.SELECT_EFFECTYN;
        return <>
          <h4>{m.type === OcgMessageType.SELECT_EFFECTYN ? `Ativar efeito de ${name(m.code)}?` : 'Confirmar?'}</h4>
          {btn('Sim', { type: t, yes: true } as OcgResponse, true)}{btn('Não', { type: t, yes: false } as OcgResponse)}
        </>;
      }
      case OcgMessageType.SELECT_OPTION:
        return <><h4>Escolha uma opção</h4>{m.options.map((_, i) => btn(`Opção ${i + 1}`, { type: OcgResponseType.SELECT_OPTION, index: i }))}</>;
      case OcgMessageType.SELECT_POSITION: {
        const opts: [number, string][] = [[1, 'Ataque'], [4, 'Defesa'], [8, 'Defesa (baixada)'], [2, 'Ataque (baixada)']];
        return <><h4>Posição de {name(m.code)}</h4>{opts.filter(([p]) => m.positions & p).map(([p, l]) => btn(l, { type: OcgResponseType.SELECT_POSITION, position: p as never }))}</>;
      }
      case OcgMessageType.SELECT_PLACE:
      case OcgMessageType.SELECT_DISFIELD:
        return <><h4>Zona escolhida automaticamente</h4>{btn('Confirmar', { type: m.type === OcgMessageType.SELECT_PLACE ? OcgResponseType.SELECT_PLACE : OcgResponseType.SELECT_DISFIELD, places: freePlaces(m.field_mask, m.player, m.count) }, true)}</>;
      case OcgMessageType.SELECT_CARD:
      case OcgMessageType.SELECT_TRIBUTE: {
        const list = m.selects as { code: number; location: number }[];
        const ok = sel.length >= m.min && sel.length <= m.max;
        const t = m.type === OcgMessageType.SELECT_CARD ? OcgResponseType.SELECT_CARD : OcgResponseType.SELECT_TRIBUTE;
        return <>
          <h4>{m.type === OcgMessageType.SELECT_TRIBUTE ? 'Escolha os tributos' : 'Escolha as cartas'} ({m.min}–{m.max})</h4>
          {list.map((c, i) => <button key={i} className={sel.includes(i) ? 'on' : ''} onClick={() => setSel((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i])}>{where(c)}</button>)}
          <button className="primary" disabled={!ok} onClick={() => reply({ type: t, indicies: sel } as OcgResponse)}>Confirmar</button>
          {m.can_cancel && btn('Cancelar', { type: t, indicies: null } as OcgResponse)}
        </>;
      }
      case OcgMessageType.SELECT_UNSELECT_CARD:
        return <>
          <h4>Escolha uma carta</h4>
          {m.select_cards.map((c, i) => btn(where(c), { type: OcgResponseType.SELECT_UNSELECT_CARD, index: i }))}
          {m.can_finish && btn('Concluir', { type: OcgResponseType.SELECT_UNSELECT_CARD, index: null }, true)}
        </>;
      default:
        return <><h4>Prompt ainda não suportado na UI (tipo {m.type})</h4></>;
    }
  }, [prompt, sel, cards]);

  return (
    <div className="app">
      {board ? <BoardView b={board} cards={cards} opponent={opponent} onZoom={setZoom} /> : <div className="stats">Carregando motor…</div>}
      <div className="log">{log.slice(-40).map((l, i) => <div key={i}>{l}</div>)}<div ref={logEnd} /></div>
      {ended ? <div className="panel"><h4>{ended.text}</h4><button className="primary" onClick={() => onEnd(ended.won)}>Continuar</button></div>
        : actions && <div className="panel">{actions}</div>}
      <div className="stats">{info}</div>
      {zoom != null && <ZoomCard code={zoom} cards={cards} onClose={() => setZoom(null)} />}
    </div>
  );
}
