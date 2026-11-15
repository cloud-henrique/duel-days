import type { ReactNode } from 'react';
import { OcgLocation, OcgMessageType, OcgPosition, OcgResponseType, type OcgMessage, type OcgResponse } from 'ocgcore-wasm';
import { Warning } from '@phosphor-icons/react';
import { freePlaces } from '../../engine/cpu';
import { ICONS } from '../../components/CardSheet';
import type { Cards } from '../../data/cards';
import { SortCards } from './SortCards';

const LOC: Record<number, string> = { [OcgLocation.HAND]: 'mão', [OcgLocation.MZONE]: 'campo', [OcgLocation.SZONE]: 'M/A', [OcgLocation.GRAVE]: 'cemitério', [OcgLocation.DECK]: 'deck' };
const POSITIONS: [number, string][] = [
  [OcgPosition.FACEUP_ATTACK, 'Ataque'], [OcgPosition.FACEUP_DEFENSE, 'Defesa'],
  [OcgPosition.FACEDOWN_DEFENSE, 'Defesa (baixada)'], [OcgPosition.FACEDOWN_ATTACK, 'Ataque (baixada)'],
];

/**
 * Conteúdo do painel para prompts que não são "tocar numa carta" (corrente, sim/não, escolhas).
 * Devolve null para os prompts tratados pelas cartas e pelos botões laterais.
 */
export function promptPanel(m: OcgMessage | null, ctx: {
  name: (code: number) => string; cards: Cards; evText: string; sel: number[];
  setSel: (f: (s: number[]) => number[]) => void; reply: (r: OcgResponse) => void; peek: () => void; autoPass: () => void;
}): ReactNode {
  if (!m) return null;
  const { name, reply, sel } = ctx;
  const btn = (label: string, r: OcgResponse, primary = false) => <button key={label + JSON.stringify(r)} className={`hud-btn ${primary ? 'primary' : ''}`} onClick={() => reply(r)}>{label}</button>;
  const where = (x: { location: number; code: number }) => `${name(x.code)} (${LOC[x.location] ?? ''})`;
  switch (m.type) {
    case OcgMessageType.SELECT_CHAIN:
      return <>
        <div className="alert"><Warning size={20} weight="fill" color="#f59e0b" /><b>{ctx.evText || 'Responder em corrente?'}</b></div>
        <p className="sub">Você pode responder.</p>
        {m.selects.map((c, i) => <button key={i} className="hud-btn wide primary" onClick={() => reply({ type: OcgResponseType.SELECT_CHAIN, index: i })}>{ICONS.bolt}<span>{name(c.code)}</span></button>)}
        {!m.forced && <button className="hud-btn wide" onClick={() => reply({ type: OcgResponseType.SELECT_CHAIN, index: null })}><span>Passar</span></button>}
        <button className="hud-btn wide" onClick={ctx.peek}>{ICONS.eye}<span>Ver campo</span></button>
        {!m.forced && <button className="linkbtn" onClick={() => { ctx.autoPass(); reply({ type: OcgResponseType.SELECT_CHAIN, index: null }); }}>Não perguntar mais neste duelo</button>}
      </>;
    case OcgMessageType.SELECT_YESNO:
    case OcgMessageType.SELECT_EFFECTYN: {
      const t = m.type === OcgMessageType.SELECT_YESNO ? OcgResponseType.SELECT_YESNO : OcgResponseType.SELECT_EFFECTYN;
      return <><h4>{m.type === OcgMessageType.SELECT_EFFECTYN ? `Ativar efeito de ${name(m.code)}?` : 'Confirmar?'}</h4><div className="acts">{btn('Sim', { type: t, yes: true } as OcgResponse, true)}{btn('Não', { type: t, yes: false } as OcgResponse)}</div></>;
    }
    case OcgMessageType.SELECT_OPTION:
      return <><h4>Escolha uma opção</h4>{m.options.map((_, i) => btn(`Opção ${i + 1}`, { type: OcgResponseType.SELECT_OPTION, index: i }))}</>;
    case OcgMessageType.SELECT_POSITION:
      return <><h4>Posição de {name(m.code)}</h4><div className="acts">{POSITIONS.filter(([p]) => m.positions & p).map(([p, l]) => btn(l, { type: OcgResponseType.SELECT_POSITION, position: p as never }, p === OcgPosition.FACEUP_ATTACK))}</div></>;
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
        {list.map((c, i) => <button key={i} className={`hud-btn ${sel.includes(i) ? 'on' : ''}`} onClick={() => ctx.setSel((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i])}>{where(c)}</button>)}
        <button className="hud-btn primary" disabled={!ok} onClick={() => reply({ type: t, indicies: sel } as OcgResponse)}>Confirmar</button>
        {m.can_cancel && btn('Cancelar', { type: t, indicies: null } as OcgResponse)}
      </>;
    }
    case OcgMessageType.SELECT_UNSELECT_CARD:
      return <><h4>Escolha uma carta</h4>{m.select_cards.map((c, i) => btn(where(c), { type: OcgResponseType.SELECT_UNSELECT_CARD, index: i }))}{m.can_finish && btn('Concluir', { type: OcgResponseType.SELECT_UNSELECT_CARD, index: null }, true)}</>;
    case OcgMessageType.SORT_CARD:
      return <SortCards key={m.cards.map((c) => c.code).join()} cards={ctx.cards} list={m.cards} reply={reply} />;
    case OcgMessageType.SELECT_IDLECMD:
    case OcgMessageType.SELECT_BATTLECMD:
      return null; // feito pelas cartas e pelos botões laterais
    default:
      return <h4>Prompt ainda não suportado na UI (tipo {m.type})</h4>;
  }
}
