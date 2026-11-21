import type { ReactNode } from 'react';
import { OcgLocation } from 'ocgcore-wasm';
import type { Board } from '../../engine/protocol';
import type { Cards } from '../../data/cards';
import { FORMAT } from '../../game/format';
import { Slot, markOf, type OnTapCard } from './Slot';
import { SIDES, SideCell, type PileKind, type RowKind } from './Piles';
import { art } from '../../components/CardSheet';

/**
 * O campo do Speed Duel como no Duel Links (change speed-duel): plano, com 4 fileiras de zonas (M/A e monstros do
 * oponente, faixa central, monstros e M/A do jogador). Cada fileira tem as 3 zonas em jogo (`FORMAT.columns`) e uma
 * ponta de cada lado com a Zona de Campo ou uma pilha (`SIDES`). A metade de quem joga o turno ganha luz.
 */
export function Field({ board, cards, hl, picked, rel, onTap, onOpenPile, center, backdrop }: {
  board: Board; cards: Cards; hl: Set<string>; picked?: Set<string>; rel?: Set<string>; onTap: OnTapCard;
  onOpenPile: (p: 0 | 1, kind: PileKind) => void; center: ReactNode; backdrop?: number | null;
}) {
  const row = (p: 0 | 1, kind: RowKind) => {
    const pl = board.players[p];
    const cs = kind === 'm' ? pl.mzone : pl.szone;
    const location = kind === 'm' ? OcgLocation.MZONE : OcgLocation.SZONE;
    const side = { p, pl, cards, hl, picked, rel, onTap, onOpen: onOpenPile };
    const [left, right] = SIDES[p][kind];
    return (
      <div className={`row ${kind}`}>
        <SideCell cell={left} {...side} />
        {FORMAT.columns.map((seq) => {
          const cref = { controller: p, location, sequence: seq };
          return <Slot key={seq} c={cs[seq] ?? null} cards={cards} zone={kind} foe={p === 1} cref={cref} mark={markOf(cref, hl, picked, rel)} onTap={onTap} />;
        })}
        <SideCell cell={right} {...side} />
      </div>
    );
  };
  return (
    <div className="fieldwrap">
      <div className="matwrap">
        <div className={`field cut ${board.turnPlayer === 0 ? 'turn-me' : 'turn-foe'}`}>
          {backdrop ? <div key={backdrop} className="fieldart" aria-hidden="true" style={{ backgroundImage: `url(${art(backdrop, 'full')})` }} /> : null}
          {row(1, 's')}{row(1, 'm')}
          <div className="midrow">{center}</div>
          {row(0, 'm')}{row(0, 's')}
        </div>
      </div>
    </div>
  );
}
