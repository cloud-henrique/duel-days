import { useEffect, useMemo, useState } from 'react';
import { OcgLocation, OcgMessageType, type OcgMessage } from 'ocgcore-wasm';
import { loadCards, type Cards } from '../data/cards';
import type { Board } from '../engine/protocol';
import fixtures from '../screens/duel/__fixtures__/prompts.json';
import { Field } from '../screens/duel/Field';
import { Hand } from '../screens/duel/Hand';
import { Plate } from '../screens/duel/Plate';
import { PhaseBar } from '../screens/duel/PhaseBar';
import { ChoiceBar, CardChoiceList } from '../screens/duel/ChoicePanels';
import { choiceMarks, choiceOf, tapOption } from '../screens/duel/choice';
import { ICONS } from '../components/CardSheet';
import '../screens/duel/duel.css';
import { DEFAULT_AVATAR } from '../story/profile';

const board = fixtures.battle_attack.board as unknown as Board;
const [me, foe] = board.players;
const foeTargets = foe.mzone.flatMap((c, sequence) => (c ? [{ code: c.code, controller: 1, location: OcgLocation.MZONE, sequence, position: c.position }] : []));
const graveAndDeck = [...me.hand, ...foe.mzone.filter(Boolean)].slice(0, 6).map((c, i) => ({ code: c!.code, controller: i % 2, location: i < 3 ? OcgLocation.GRAVE : OcgLocation.DECK, sequence: i, position: 10 }));

const SCENES: Record<string, { msg: OcgMessage; attack?: boolean; peek?: boolean }> = {
  ataque: { msg: { type: OcgMessageType.SELECT_CARD, player: 0, can_cancel: true, min: 1, max: 1, selects: foeTargets } as unknown as OcgMessage, attack: true },
  tributos: { msg: fixtures.select_tribute.msg as unknown as OcgMessage },
  lista: { msg: { type: OcgMessageType.SELECT_CARD, player: 0, can_cancel: false, min: 1, max: 1, selects: graveAndDeck } as unknown as OcgMessage },
  'lista 1–3': { msg: { type: OcgMessageType.SELECT_CARD, player: 0, can_cancel: true, min: 1, max: 3, selects: graveAndDeck } as unknown as OcgMessage },
  'só olhando': { msg: fixtures.chain.msg as unknown as OcgMessage, peek: true },
};

/** Conferência das escolhas de cartas (só em desenvolvimento, `?choices`): tabuleiro real das fixtures. */
export function ChoiceGallery() {
  const [cards, setCards] = useState<Cards | null>(null);
  const [scene, setScene] = useState('ataque');
  const [sel, setSel] = useState<number[]>([]);
  const [last, setLast] = useState('');
  useEffect(() => { loadCards().then(setCards); }, []);
  const s = SCENES[scene];
  const c = useMemo(() => choiceOf(s.msg), [s]);
  const bc = c?.mode === 'board' ? c : null;
  const marks = choiceMarks(bc, sel);
  if (!cards) return <p>Carregando…</p>;
  const reply = (r: unknown) => { setLast(JSON.stringify(r)); setSel([]); };
  const tap = (_: number, ref: Parameters<typeof tapOption>[2]) => { const r = bc && tapOption(bc, sel, ref); if (r) { setSel(r.sel); if (r.response) reply(r.response); } };
  const who = { id: DEFAULT_AVATAR, name: 'Você' };
  return (
    <div className={`duel hexbg${s.attack ? ' pick-attack' : ''}`}>
      <div style={{ position: 'absolute', top: 4, left: 4, right: 4, zIndex: 50, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {Object.keys(SCENES).map((k) => <button key={k} onClick={() => { setScene(k); setSel([]); setLast(''); }} style={{ fontSize: 11, background: k === scene ? '#ffc61a' : '#123a7a', color: k === scene ? '#000' : '#fff', border: 0, padding: '3px 6px' }}>{k}</button>)}
        <span style={{ color: '#9fb4d9', fontSize: 10 }}>{last}</span>
      </div>
      <div className="foebar"><Plate side="foe" who={{ id: 'seto_kaiba', name: 'Seto Kaiba' }} lp={foe.lp} hand={foe.hand.length} turn={false} /></div>
      <Field board={board} cards={cards} hl={marks.glow} picked={marks.picked} onTap={tap} onOpenPile={() => {}} center={<PhaseBar turn={board.turn} phase={board.phase} narration="Conferência" />} />
      <div className="mybar"><Plate side="me" who={who} lp={me.lp} hand={me.hand.length} turn /></div>
      <div className="spacer" />
      <Hand hand={me.hand} cards={cards} hl={marks.glow} picked={marks.picked} selected={-1} onTap={tap} />
      {bc && <ChoiceBar c={bc} sel={sel} cards={cards} actor={me.mzone.find(Boolean)?.code ?? null} attack={!!s.attack} reply={reply} />}
      {c?.mode === 'list' && <div className="scrim uphand"><div className="sheet hud panel"><CardChoiceList c={c} sel={sel} setSel={(f) => setSel(f)} cards={cards} reply={reply} /><button className="hud-btn wide">{ICONS.eye}<span>Ver campo</span></button></div></div>}
      {s.peek && <div className="peekbar hud panel"><span>{ICONS.eye}Só olhando: toque numa carta para ampliar</span><button className="hud-btn primary">Voltar à resposta</button></div>}
    </div>
  );
}
