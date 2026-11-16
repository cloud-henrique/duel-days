import { OcgLocation, OcgMessageType, OcgQueryFlags, type OcgLocPos, type OcgMessage } from 'ocgcore-wasm';
import { flushBeats, newBeatCtx, toBeats, type BeatCtx } from './beats';
import type { Board, BoardCard, PlayerBoard, Step } from './protocol';
import type { DuelSession } from './session';

/** A consulta do motor devolve ATK/DEF sem sinal; "?" (−2) chegaria como 4294967294. Volta para inteiro com sinal. */
const signed = (v: number | undefined) => (v == null ? v : v | 0);

/**
 * Acompanha o duelo: traduz as mensagens do motor em beats (`beats.ts`), mantém LP, turno e fase a partir deles e tira a
 * "foto" do tabuleiro para a interface. O texto do narrador sai de `beatText`, na tela.
 */
export class Narrator {
  lp: [number, number] = [8000, 8000];
  turn = 0;
  turnPlayer = 0;
  phase = 0;
  private session: DuelSession | null = null;
  private ctx: BeatCtx = newBeatCtx((l) => this.codeAt(l));

  reset() { this.lp = [8000, 8000]; this.turn = 0; this.turnPlayer = 0; this.phase = 0; this.ctx = newBeatCtx((l) => this.codeAt(l)); }

  private codeAt(l: OcgLocPos) {
    const s = this.session;
    if (!s) return 0;
    const c = s.core.duelQuery(s.handle, { flags: OcgQueryFlags.CODE as OcgQueryFlags, controller: l.controller, location: l.location, sequence: l.sequence, overlaySequence: 0 });
    return c?.code ?? 0;
  }

  /** Beats de uma mensagem, já aplicados ao estado (LP, turno, fase). */
  feed(m: OcgMessage, s: DuelSession): Step[] {
    this.session = s;
    if (m.type === OcgMessageType.LPUPDATE) { this.lp[m.player] = m.lp; return []; }
    return this.track(toBeats(m, this.ctx));
  }

  /** Solta o que ficou pendente (movimento para o campo sem invocação/baixa em seguida). Chamar no fim de cada passo. */
  flush(): Step[] { return this.track(flushBeats(this.ctx)); }

  private track(steps: Step[]) {
    for (const { beat: b } of steps) {
      if (b.k === 'turn') { this.turn = b.n; this.turnPlayer = b.p; }
      else if (b.k === 'phase') this.phase = b.phase;
      else if (b.k === 'lp') this.lp[b.p] += b.delta;
    }
    return steps;
  }

  snapshot(s: DuelSession): Board {
    const flags = (OcgQueryFlags.CODE | OcgQueryFlags.POSITION | OcgQueryFlags.ATTACK | OcgQueryFlags.DEFENSE) as OcgQueryFlags;
    const q = (controller: 0 | 1, location: OcgLocation): (BoardCard | null)[] =>
      s.core.duelQueryLocation(s.handle, { flags, controller, location }).map((c) =>
        c && c.code ? { code: c.code, position: c.position ?? 0, attack: signed(c.attack), defense: signed(c.defense) } : null);
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
