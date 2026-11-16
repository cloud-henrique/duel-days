/**
 * Caracterização do texto do narrador: o que o antigo `Narrator.describe` escrevia para cada mensagem que tratava. O
 * texto agora sai de `beatText` sobre os beats do `Narrator` (change `animar-duelo`); estes casos garantem que o
 * histórico do duelo não mudou.
 */
import { describe, expect, it } from 'vitest';
import { OcgLocation, OcgMessageType, type OcgMessage } from 'ocgcore-wasm';
import { beatText } from './beats';
import { Narrator } from './narrator';
import type { DuelSession } from './session';

const NAMES: Record<number, string> = { 1: 'Dragão Branco de Olhos Azuis', 2: 'Mago Negro', 3: 'Buraco Negro' };
const nameOf = (code: number) => NAMES[code] ?? `#${code}`;

/** Sessão falsa: a consulta de uma carta (usada no ataque) devolve o código do Mago Negro. */
const session = { core: { duelQuery: () => ({ code: 2 }) }, handle: 0 } as unknown as DuelSession;

const loc = (controller: 0 | 1, location: OcgLocation, sequence: number) => ({ controller, location, sequence, position: 1 }) as const;

/** Narra uma sequência de mensagens num narrador novo e devolve o texto e o narrador (para conferir LP e turno). */
function narrate(...msgs: unknown[]) {
  const n = new Narrator();
  const steps = [...msgs.flatMap((m) => n.feed(m as OcgMessage, session)), ...n.flush()];
  return { out: steps.flatMap((st) => beatText(st.beat, nameOf)), n };
}

describe('texto do narrador (caracterização)', () => {
  it('turno: contador e dono', () => {
    const { out, n } = narrate({ type: OcgMessageType.NEW_TURN, player: 0 }, { type: OcgMessageType.NEW_TURN, player: 1 });
    expect(out).toEqual(['— Turno 1 (Você) —', '— Turno 2 (Oponente) —']);
    expect([n.turn, n.turnPlayer]).toEqual([2, 1]);
  });

  it('fase: só guarda, sem texto', () => {
    const { out, n } = narrate({ type: OcgMessageType.NEW_PHASE, phase: 4 });
    expect(out).toEqual([]);
    expect(n.phase).toBe(4);
  });

  it('compra do jogador: uma linha por carta, com o nome', () => {
    const { out } = narrate({ type: OcgMessageType.DRAW, player: 0, drawn: [{ code: 1, position: 1 }, { code: 3, position: 1 }] });
    expect(out).toEqual(['Você comprou Dragão Branco de Olhos Azuis', 'Você comprou Buraco Negro']);
  });

  it('compra do oponente: uma linha só, sem nome', () => {
    const { out } = narrate({ type: OcgMessageType.DRAW, player: 1, drawn: [{ code: 1, position: 1 }, { code: 2, position: 1 }] });
    expect(out).toEqual(['Oponente comprou uma carta']);
  });

  it('invocação normal e especial', () => {
    const { out } = narrate(
      { type: OcgMessageType.SUMMONING, code: 1, controller: 0, location: OcgLocation.MZONE, sequence: 0, position: 1 },
      { type: OcgMessageType.SPSUMMONING, code: 2, controller: 1, location: OcgLocation.MZONE, sequence: 2, position: 1 },
    );
    expect(out).toEqual(['Você invocou Dragão Branco de Olhos Azuis', 'Oponente invocou Mago Negro']);
  });

  it('invocação por virada: sem texto hoje', () => {
    const { out } = narrate({ type: OcgMessageType.FLIPSUMMONING, code: 1, controller: 0, location: OcgLocation.MZONE, sequence: 0, position: 1 });
    expect(out).toEqual([]);
  });

  it('baixar: sem revelar a carta', () => {
    const { out } = narrate({ type: OcgMessageType.SET, code: 3, controller: 1, location: OcgLocation.SZONE, sequence: 1, position: 8 });
    expect(out).toEqual(['Oponente baixou uma carta']);
  });

  it('ataque: nome do atacante consultado no motor', () => {
    const { out } = narrate({ type: OcgMessageType.ATTACK, card: loc(0, OcgLocation.MZONE, 0), target: null });
    expect(out).toEqual(['Você ataca com Mago Negro']);
  });

  it('ativação', () => {
    const { out } = narrate({ type: OcgMessageType.CHAINING, code: 3, controller: 1, location: OcgLocation.SZONE, sequence: 0, position: 1, chain_size: 1 });
    expect(out).toEqual(['Oponente ativou Buraco Negro']);
  });

  it('LP: dano, cura e custo, com o LP acompanhado', () => {
    const { out, n } = narrate(
      { type: OcgMessageType.DAMAGE, player: 1, amount: 1200 },
      { type: OcgMessageType.RECOVER, player: 1, amount: 500 },
      { type: OcgMessageType.PAY_LPCOST, player: 0, amount: 1000 },
    );
    expect(out).toEqual(['Oponente perdeu 1200 LP', 'Oponente recuperou 500 LP', 'Você pagou 1000 LP']);
    expect(n.lp).toEqual([7000, 7300]);
  });

  it('LPUPDATE: só corrige o LP, sem texto', () => {
    const { out, n } = narrate({ type: OcgMessageType.LPUPDATE, player: 0, lp: 4321 });
    expect(out).toEqual([]);
    expect(n.lp[0]).toBe(4321);
  });

  it('fim do duelo', () => {
    expect(narrate({ type: OcgMessageType.WIN, player: 0, reason: 0 }).out).toEqual(['Você venceu!']);
    expect(narrate({ type: OcgMessageType.WIN, player: 1, reason: 0 }).out).toEqual(['O oponente venceu.']);
  });

  it('mensagens sem texto hoje: movimento, posição, corrente, equipamento, moeda e dado', () => {
    const { out } = narrate(
      { type: OcgMessageType.MOVE, card: 1, from: loc(0, OcgLocation.MZONE, 0), to: loc(0, OcgLocation.GRAVE, 0) },
      { type: OcgMessageType.POS_CHANGE, code: 1, controller: 0, location: OcgLocation.MZONE, sequence: 0, prev_position: 8, position: 1 },
      { type: OcgMessageType.CHAIN_SOLVING, chain_size: 1 },
      { type: OcgMessageType.CHAIN_NEGATED, chain_size: 1 },
      { type: OcgMessageType.EQUIP, card: loc(0, OcgLocation.SZONE, 0), target: loc(0, OcgLocation.MZONE, 0) },
      { type: OcgMessageType.TOSS_COIN, player: 0, results: [true] },
      { type: OcgMessageType.TOSS_DICE, player: 1, results: [4] },
    );
    expect(out).toEqual([]);
  });
});
