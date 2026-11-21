import { OcgMessageType, type OcgMessage } from 'ocgcore-wasm';
import { START_LPS } from '../game/format';

/**
 * O mínimo do estado que a consulta ao motor não dá (LP, turno, fase, vencedor), acompanhado pelas mensagens. É o que a
 * busca da CPU usa nas cópias do duelo, sem o custo do narrador.
 */
export class DuelTrack {
  lp: [number, number];
  turn = 0;
  turnPlayer = 0;
  phase = 0;
  winner: number | null = null;
  /** Ataques declarados desde o último `resetAttacks` (quem atacou e o alvo; alvo nulo é ataque direto). */
  attacks: { controller: number; sequence: number; target: { controller: number; sequence: number } | null }[] = [];

  constructor(lp: [number, number] = START_LPS) { this.lp = [...lp]; }

  feed(ms: OcgMessage[]) {
    for (const m of ms) {
      switch (m.type) {
        case OcgMessageType.NEW_TURN: this.turn++; this.turnPlayer = m.player & 1; break;
        case OcgMessageType.NEW_PHASE: this.phase = m.phase; break;
        case OcgMessageType.LPUPDATE: this.lp[m.player & 1] = m.lp; break;
        case OcgMessageType.DAMAGE: case OcgMessageType.PAY_LPCOST: this.lp[m.player & 1] -= m.amount; break;
        case OcgMessageType.RECOVER: this.lp[m.player & 1] += m.amount; break;
        case OcgMessageType.WIN: this.winner = m.player; break;
        case OcgMessageType.ATTACK:
          this.attacks.push({
            controller: m.card.controller, sequence: m.card.sequence,
            target: m.target ? { controller: m.target.controller, sequence: m.target.sequence } : null,
          });
          break;
        default: break;
      }
    }
  }

  clone() {
    const t = new DuelTrack(this.lp);
    Object.assign(t, { turn: this.turn, turnPlayer: this.turnPlayer, phase: this.phase, winner: this.winner });
    return t;
  }
}
