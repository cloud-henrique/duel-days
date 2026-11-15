import { Crosshair } from '@phosphor-icons/react';
import { OcgMessageType, type OcgResponse } from 'ocgcore-wasm';
import type { Cards } from '../../data/cards';
import { CardBack, CardFace } from '../../components/CardFace';
import { canConfirm, cancelResponse, chosenWeight, choiceText, confirmResponse, placeCaption, tapOption, type Choice } from './choice';

type Reply = (r: OcgResponse) => void;
type SetSel = (f: (s: number[]) => number[]) => void;

/** Botões de baixo das duas formas de escolha: Cancelar, Confirmar (quando o toque não decide) e Concluir. */
function ChoiceButtons({ c, sel, reply }: { c: Choice; sel: number[]; reply: Reply }) {
  const unselect = c.type === OcgMessageType.SELECT_UNSELECT_CARD;
  // Com min = max, o toque que completa já responde; o Confirmar só aparece quando a quantidade é livre.
  const confirm = !unselect && c.min !== c.max;
  if (!c.canCancel && !confirm && !c.canFinish) return null;
  return (
    <div className="acts">
      {c.canCancel && <button className="hud-btn danger" onClick={() => reply(cancelResponse(c))}>Cancelar</button>}
      {confirm && <button className="hud-btn primary" disabled={!canConfirm(c, sel)} onClick={() => reply(confirmResponse(c, sel))}>Confirmar</button>}
      {c.canFinish && <button className="hud-btn primary" onClick={() => reply(cancelResponse(c))}>Concluir</button>}
    </div>
  );
}

/**
 * Barra da escolha no tabuleiro, no lugar do painel (como o BoardSelectionPrompt do nativo): a carta que age, o que
 * escolher e o contador. A escolha é no campo: as cartas que valem brilham e o jogador toca nelas.
 */
export function ChoiceBar({ c, sel, cards, actor, attack, reply }: { c: Choice; sel: number[]; cards: Cards; actor: number | null; attack: boolean; reply: Reply }) {
  const info = actor != null ? cards[String(actor)] : undefined;
  const { title, hint } = choiceText(c, info?.name ?? null, attack);
  const counter = c.type !== OcgMessageType.SELECT_UNSELECT_CARD && c.max > 1;
  return (
    <div className={`choicebar hud panel${attack ? ' attack' : ''}`} role="status">
      <div className="choicehead">
        {actor != null && <div className="choicecard"><CardFace code={actor} card={info} /></div>}
        <div className="choicetext"><b>{title}</b><span>{hint}</span></div>
        {counter && <span className="choicecount num">{chosenWeight(c, sel)}/{c.min === c.max ? c.max : `${c.min}–${c.max}`}</span>}
      </div>
      <ChoiceButtons c={c} sel={sel} reply={reply} />
    </div>
  );
}

/**
 * Escolha em lista (cartas fora do campo: Deck, cemitério, banidas), como o CardChoiceGrid do nativo: uma fileira de
 * cartas para tocar, com a origem embaixo. O toque que completa a escolha já responde.
 */
export function CardChoiceList({ c, sel, setSel, cards, reply }: { c: Choice; sel: number[]; setSel: SetSel; cards: Cards; reply: Reply }) {
  const unselect = c.type === OcgMessageType.SELECT_UNSELECT_CARD;
  const n = c.min === c.max ? `${c.max}` : `de ${c.min} a ${c.max}`;
  const items = [...c.options.map((o, i) => ({ o, on: sel.includes(i) })), ...c.marked.map((o) => ({ o, on: true }))];
  const pick = (i: number) => {
    const r = tapOption(c, sel, items[i].o.ref);
    if (!r) return;
    setSel(() => r.sel);
    if (r.response) reply(r.response);
  };
  return <>
    <h4 className="choicetitle"><Crosshair size={18} weight="bold" />{c.max === 1 && !unselect ? 'Escolha uma carta' : `Escolha ${n} cartas`}</h4>
    <div className="choicerow">
      {items.map(({ o, on }, i) => {
        const info = cards[String(o.code)];
        // O código 0 é carta virada do oponente: escolher não a revela.
        return (
          <button key={i} className={`choiceitem${on ? ' on' : ''}`} aria-pressed={on} aria-label={`${info?.name ?? 'Carta virada'}, ${placeCaption(o.ref)}`} onClick={() => pick(i)}>
            {o.code ? <CardFace code={o.code} card={info} /> : <CardBack />}
            <small>{placeCaption(o.ref)}</small>
          </button>
        );
      })}
    </div>
    <ChoiceButtons c={c} sel={sel} reply={reply} />
  </>;
}
