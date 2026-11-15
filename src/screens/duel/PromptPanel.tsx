import type { ReactNode } from 'react';
import { OcgMessageType, OcgPosition, OcgResponseType, type OcgMessage, type OcgResponse } from 'ocgcore-wasm';
import { freePlaces } from '../../engine/cpu';
import { ICONS } from '../../components/CardSheet';
import type { Cards } from '../../data/cards';
import { SortCards } from './SortCards';
import { choiceOf } from './choice';
import { CardChoiceList } from './ChoicePanels';

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
  setSel: (f: (s: number[]) => number[]) => void; reply: (r: OcgResponse) => void; autoPass: () => void;
}): ReactNode {
  if (!m) return null;
  const { name, reply, sel } = ctx;
  const btn = (label: string, r: OcgResponse, primary = false) => <button key={label + JSON.stringify(r)} className={`hud-btn ${primary ? 'primary' : ''}`} onClick={() => reply(r)}>{label}</button>;
  switch (m.type) {
    case OcgMessageType.SELECT_CHAIN:
      return <>
        <div className="alert">{ICONS.chain}<b>{ctx.evText || 'Responder em corrente?'}</b></div>
        <p className="sub">Você pode responder.</p>
        {m.selects.map((c, i) => <button key={i} className="hud-btn wide primary" onClick={() => reply({ type: OcgResponseType.SELECT_CHAIN, index: i })}>{ICONS.activate}<span>{name(c.code)}</span></button>)}
        {!m.forced && <button className="hud-btn wide" onClick={() => reply({ type: OcgResponseType.SELECT_CHAIN, index: null })}><span>Passar</span></button>}
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
    case OcgMessageType.SELECT_TRIBUTE:
    case OcgMessageType.SELECT_UNSELECT_CARD: {
      // No tabuleiro, a escolha é a barra (ChoiceBar) e o toque nas cartas; aqui só a lista de cartas fora do campo.
      const c = choiceOf(m);
      return c?.mode === 'list' ? <CardChoiceList c={c} sel={sel} setSel={ctx.setSel} cards={ctx.cards} reply={reply} /> : null;
    }
    case OcgMessageType.SORT_CARD:
      return <SortCards key={m.cards.map((c) => c.code).join()} cards={ctx.cards} list={m.cards} reply={reply} />;
    case OcgMessageType.SELECT_IDLECMD:
    case OcgMessageType.SELECT_BATTLECMD:
      return null; // feito pelas cartas e pelos botões laterais
    default:
      return <h4>Prompt ainda não suportado na UI (tipo {m.type})</h4>;
  }
}
