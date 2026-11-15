import type { ReactNode } from 'react';
import { OcgLocation } from 'ocgcore-wasm';
import type { Board, BoardCard } from '../../engine/protocol';
import type { Cards } from '../../data/cards';
import { Slot, markOf, type OnTapCard, type ZoneKind } from './Slot';

const ROW_ZONES = 5;
const FIELD_ZONE_SEQ = 5;

/** O campo em perspectiva: M/A e monstros do oponente, faixa central, monstros e M/A do jogador. */
export function Field({ board, cards, hl, picked, onTap, center }: { board: Board; cards: Cards; hl: Set<string>; picked?: Set<string>; onTap: OnTapCard; center: ReactNode }) {
  const [me, foe] = board.players;
  const row = (cs: (BoardCard | null)[], controller: 0 | 1, location: number, zone: ZoneKind) => (
    <div className="row">{cs.slice(0, ROW_ZONES).map((c, i) => {
      const cref = { controller, location, sequence: i };
      return <Slot key={i} c={c} cards={cards} zone={zone} foe={controller === 1} cref={cref} mark={markOf(cref, hl, picked)} onTap={onTap} />;
    })}</div>
  );
  const fieldZone = (p: 0 | 1) => {
    const cref = { controller: p, location: OcgLocation.SZONE, sequence: FIELD_ZONE_SEQ };
    return <Slot c={board.players[p].szone[FIELD_ZONE_SEQ] ?? null} cards={cards} zone="f" foe={p === 1} cref={cref} mark={markOf(cref, hl, picked)} onTap={onTap} />;
  };
  return (
    <div className="fieldwrap">
      <div className="field">
        {row(foe.szone, 1, OcgLocation.SZONE, 's')}{row(foe.mzone, 1, OcgLocation.MZONE, 'm')}
        <div className="midrow">{fieldZone(0)}<span />{fieldZone(1)}{center}</div>
        {row(me.mzone, 0, OcgLocation.MZONE, 'm')}{row(me.szone, 0, OcgLocation.SZONE, 's')}
      </div>
    </div>
  );
}
