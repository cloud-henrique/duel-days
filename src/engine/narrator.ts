import { OcgLocation, OcgMessageType, OcgQueryFlags, type OcgLocPos, type OcgMessage } from 'ocgcore-wasm';
import { flushBeats, newBeatCtx, toBeats, type BeatCtx } from './beats';
import type { Board, BoardCard, CardLink, PlayerBoard, Step } from './protocol';
import type { DuelSession } from './session';
import { START_LPS } from '../game/format';

/** A consulta do motor devolve ATK/DEF sem sinal; "?" (−2) chegaria como 4294967294. Volta para inteiro com sinal. */
const signed = (v: number | undefined) => (v == null ? v : v | 0);

/**
 * Acompanha o duelo: traduz as mensagens do motor em beats (`beats.ts`), mantém LP, turno e fase a partir deles e tira a
 * "foto" do tabuleiro para a interface. O texto do narrador sai de `beatText`, na tela.
 */
export class Narrator {
  lp: [number, number] = [...START_LPS];
  turn = 0;
  turnPlayer = 0;
  phase = 0;
  private session: DuelSession | null = null;
  private ctx: BeatCtx = newBeatCtx((l) => this.codeAt(l));

  reset() { this.lp = [...START_LPS]; this.turn = 0; this.turnPlayer = 0; this.phase = 0; this.ctx = newBeatCtx((l) => this.codeAt(l)); }

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
    // No campo, também quem equipa/mantém alvo e o dono (para marcar "Equipado", "Alvo" e "Tomado" na tela).
    const fieldFlags = (flags | OcgQueryFlags.EQUIP_CARD | OcgQueryFlags.TARGET_CARD | OcgQueryFlags.OWNER) as OcgQueryFlags;
    type Raw = ReturnType<DuelSession['core']['duelQueryLocation']>[number];
    const raw = new Map<string, Raw[]>();
    const query = (controller: 0 | 1, location: OcgLocation) => {
      const field = location === OcgLocation.MZONE || location === OcgLocation.SZONE;
      const r = s.core.duelQueryLocation(s.handle, { flags: field ? fieldFlags : flags, controller, location });
      if (field) raw.set(`${controller}:${location}`, r);
      return r;
    };
    const q = (controller: 0 | 1, location: OcgLocation): (BoardCard | null)[] =>
      query(controller, location).map((c) => {
        if (!c || !c.code) return null;
        const card: BoardCard = { code: c.code, position: c.position ?? 0, attack: signed(c.attack), defense: signed(c.defense) };
        if (c.owner != null && c.owner !== controller) card.stolen = true;
        return card;
      });
    const pb = (p: 0 | 1): PlayerBoard => ({
      lp: this.lp[p],
      deck: s.core.duelQueryCount(s.handle, p, OcgLocation.DECK),
      hand: q(p, OcgLocation.HAND).filter(Boolean) as BoardCard[],
      mzone: q(p, OcgLocation.MZONE),
      szone: q(p, OcgLocation.SZONE),
      grave: q(p, OcgLocation.GRAVE).filter(Boolean) as BoardCard[],
      removed: q(p, OcgLocation.REMOVED).filter(Boolean) as BoardCard[],
      extra: q(p, OcgLocation.EXTRA).filter(Boolean) as BoardCard[],
    });
    const players: [PlayerBoard, PlayerBoard] = [pb(0), pb(1)];
    linkCards(players, raw);
    return { players, turn: this.turn, turnPlayer: this.turnPlayer, phase: this.phase };
  }
}

type RawCard = { code?: number; equipCard?: { controller: number; location: number; sequence: number } | null; targetCards?: { controller: number; location: number; sequence: number }[] } | null;

/** Liga as cartas do campo pelas consultas de equipamento e alvo: cada ponta ganha um `CardLink` para a outra. */
export function linkCards(players: [PlayerBoard, PlayerBoard], raw: Map<string, RawCard[]>) {
  const at = (controller: number, location: number, sequence: number): BoardCard | null => {
    const pl = players[controller as 0 | 1];
    if (!pl) return null;
    if (location === OcgLocation.MZONE) return pl.mzone[sequence] ?? null;
    if (location === OcgLocation.SZONE) return pl.szone[sequence] ?? null;
    return null;
  };
  const add = (card: BoardCard, l: CardLink) => {
    const ls = (card.links ??= []);
    if (!ls.some((x) => x.controller === l.controller && x.location === l.location && x.sequence === l.sequence && x.dir === l.dir)) ls.push(l);
  };
  for (const [key, list] of raw) {
    const [controller, location] = key.split(':').map(Number) as [0 | 1, number];
    list.forEach((c, sequence) => {
      const src = at(controller, location, sequence);
      if (!c || !src) return;
      const tie = (kind: CardLink['kind'], t: { controller: number; location: number; sequence: number }) => {
        const dst = at(t.controller, t.location, t.sequence);
        if (!dst || dst === src) return;
        add(src, { kind, dir: 'to', code: dst.code, controller: t.controller as 0 | 1, location: t.location, sequence: t.sequence });
        add(dst, { kind, dir: 'by', code: src.code, controller, location, sequence });
      };
      if (c.equipCard) tie('equip', c.equipCard);
      for (const t of c.targetCards ?? []) {
        if (c.equipCard && t.controller === c.equipCard.controller && t.location === c.equipCard.location && t.sequence === c.equipCard.sequence) continue;
        tie('target', t);
      }
    });
  }
}
