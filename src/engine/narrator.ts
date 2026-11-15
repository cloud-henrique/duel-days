import { OcgLocation, OcgMessageType, OcgQueryFlags, type OcgMessage } from 'ocgcore-wasm';
import type { Board, BoardCard, PlayerBoard } from './protocol';
import type { DuelSession } from './session';

/** Acompanha o duelo: LP, turno e fase, descreve eventos em texto e tira a "foto" do tabuleiro para a interface. */
export class Narrator {
  lp: [number, number] = [8000, 8000];
  turn = 0;
  turnPlayer = 0;
  phase = 0;
  constructor(private nameOf: (code: number) => string) {}

  reset() { this.lp = [8000, 8000]; this.turn = 0; this.turnPlayer = 0; this.phase = 0; }

  private who = (p: number) => (p === 0 ? 'Você' : 'Oponente');
  private codeAt(s: DuelSession, controller: number, location: OcgLocation, sequence: number) {
    const c = s.core.duelQuery(s.handle, { flags: OcgQueryFlags.CODE as OcgQueryFlags, controller: controller as 0 | 1, location, sequence, overlaySequence: 0 });
    return c?.code ?? 0;
  }

  describe(m: OcgMessage, out: string[], s: DuelSession) {
    const nm = this.nameOf, who = this.who;
    switch (m.type) {
      case OcgMessageType.NEW_TURN: this.turn++; this.turnPlayer = m.player; out.push(`— Turno ${this.turn} (${who(m.player)}) —`); break;
      case OcgMessageType.NEW_PHASE: this.phase = m.phase; break;
      case OcgMessageType.DRAW: if (m.player === 0) m.drawn.forEach((d) => out.push(`Você comprou ${nm(d.code)}`)); else out.push('Oponente comprou uma carta'); break;
      case OcgMessageType.SUMMONING: case OcgMessageType.SPSUMMONING: out.push(`${who(m.controller)} invocou ${nm(m.code)}`); break;
      case OcgMessageType.SET: out.push(`${who(m.controller)} baixou uma carta`); break;
      case OcgMessageType.ATTACK: out.push(`${who(m.card.controller)} ataca com ${nm(this.codeAt(s, m.card.controller, m.card.location, m.card.sequence))}`); break;
      case OcgMessageType.CHAINING: out.push(`${who(m.controller)} ativou ${nm(m.code)}`); break;
      case OcgMessageType.DAMAGE: this.lp[m.player] -= m.amount; out.push(`${who(m.player)} perdeu ${m.amount} LP`); break;
      case OcgMessageType.RECOVER: this.lp[m.player] += m.amount; out.push(`${who(m.player)} recuperou ${m.amount} LP`); break;
      case OcgMessageType.PAY_LPCOST: this.lp[m.player] -= m.amount; out.push(`${who(m.player)} pagou ${m.amount} LP`); break;
      case OcgMessageType.LPUPDATE: this.lp[m.player] = m.lp; break;
      case OcgMessageType.WIN: out.push(m.player === 0 ? 'Você venceu!' : 'O oponente venceu.'); break;
    }
  }

  snapshot(s: DuelSession): Board {
    const flags = (OcgQueryFlags.CODE | OcgQueryFlags.POSITION | OcgQueryFlags.ATTACK | OcgQueryFlags.DEFENSE) as OcgQueryFlags;
    const q = (controller: 0 | 1, location: OcgLocation): (BoardCard | null)[] =>
      s.core.duelQueryLocation(s.handle, { flags, controller, location }).map((c) =>
        c && c.code ? { code: c.code, position: c.position ?? 0, attack: c.attack, defense: c.defense } : null);
    const pb = (p: 0 | 1): PlayerBoard => ({
      lp: this.lp[p],
      deck: s.core.duelQueryCount(s.handle, p, OcgLocation.DECK),
      hand: q(p, OcgLocation.HAND).filter(Boolean) as BoardCard[],
      mzone: q(p, OcgLocation.MZONE),
      szone: q(p, OcgLocation.SZONE),
      grave: q(p, OcgLocation.GRAVE).filter(Boolean) as BoardCard[],
    });
    return { players: [pb(0), pb(1)], turn: this.turn, turnPlayer: this.turnPlayer, phase: this.phase };
  }
}
