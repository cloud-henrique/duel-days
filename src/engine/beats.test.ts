import { describe, expect, it } from 'vitest';
import { OcgLocation, OcgMessageType, type OcgMessage } from 'ocgcore-wasm';
import { beatText, classifyMove, locKey, newBeatCtx, toBeats, toLoc, flushBeats, type BeatCtx } from './beats';
import type { Beat, Step } from './protocol';

const T = OcgMessageType, L = OcgLocation;
const DESTROY = 0x1, BATTLE = 0x20, EFFECT = 0x40, RELEASE = 0x2, DISCARD = 0x4000, COST = 0x80;
const lp = (controller: 0 | 1, location: number, sequence: number, position = 1) => ({ controller, location, sequence, position });
const mv = (card: number, from: ReturnType<typeof lp>, to: ReturnType<typeof lp>, reason = 0) => ({ type: T.MOVE, card, from, to, reason });

/** Traduz uma sequência de mensagens com um contexto novo; o pendente é solto no fim, como faz o `Narrator`. */
function run(msgs: unknown[], ctx: BeatCtx = newBeatCtx(() => 42)): Step[] {
  const out = msgs.flatMap((m) => toBeats(m as OcgMessage, ctx));
  return [...out, ...flushBeats(ctx)];
}
const beats = (msgs: unknown[]) => run(msgs).map((s) => s.beat);

describe('classifyMove', () => {
  it('cemitério: destruição (batalha ou efeito) separada de tributo, custo e descarte', () => {
    expect(classifyMove('grave', DESTROY | BATTLE)).toBe('destroy');
    expect(classifyMove('grave', DESTROY | EFFECT)).toBe('destroy');
    expect(classifyMove('grave', RELEASE)).toBe('grave');
    expect(classifyMove('grave', EFFECT | DISCARD)).toBe('grave');
    expect(classifyMove('grave', COST)).toBe('grave');
  });
  it('outros destinos pela localização', () => {
    expect(classifyMove('removed', EFFECT)).toBe('banish');
    expect(classifyMove('hand', EFFECT)).toBe('hand');
    expect(classifyMove('deck', EFFECT)).toBe('deck');
    expect(classifyMove('extra', 0)).toBe('deck');
    expect(classifyMove('mzone', 0)).toBe('other');
  });
});

describe('toBeats', () => {
  it('turno conta a partir do contexto; fase', () => {
    expect(beats([{ type: T.NEW_TURN, player: 0 }, { type: T.NEW_TURN, player: 1 }, { type: T.NEW_PHASE, phase: 4 }])).toEqual([
      { k: 'turn', p: 0, n: 1 }, { k: 'turn', p: 1, n: 2 }, { k: 'phase', phase: 4 },
    ]);
  });

  it('compra com os códigos', () => {
    expect(beats([{ type: T.DRAW, player: 1, drawn: [{ code: 5, position: 1 }, { code: 6, position: 1 }] }])).toEqual([{ k: 'draw', p: 1, codes: [5, 6] }]);
  });

  it('MOVE da mão + SUMMONING viram uma invocação só, com a origem', () => {
    expect(beats([mv(7, lp(0, L.HAND, 2), lp(0, L.MZONE, 1)), { type: T.SUMMONING, code: 7, controller: 0, location: L.MZONE, sequence: 1, position: 1 }])).toEqual([
      { k: 'summon', from: { p: 0, zone: 'hand', seq: 2 }, to: { p: 0, zone: 'mzone', seq: 1 }, code: 7, how: 'normal' },
    ]);
  });

  it('invocação especial do cemitério e ficha (sem origem: nasce no lugar)', () => {
    expect(beats([mv(7, lp(1, L.GRAVE, 0), lp(1, L.MZONE, 3)), { type: T.SPSUMMONING, code: 7, controller: 1, location: L.MZONE, sequence: 3, position: 1 }])[0])
      .toMatchObject({ k: 'summon', from: { zone: 'grave' }, how: 'special' });
    expect(beats([mv(9, lp(0, 0, 0), lp(0, L.MZONE, 2)), { type: T.SPSUMMONING, code: 9, controller: 0, location: L.MZONE, sequence: 2, position: 1 }])[0])
      .toMatchObject({ k: 'summon', from: { zone: 'none' }, to: { zone: 'mzone', seq: 2 } });
  });

  it('MOVE + SET viram uma baixa só', () => {
    expect(beats([mv(3, lp(1, L.HAND, 0), lp(1, L.SZONE, 2, 8)), { type: T.SET, code: 3, controller: 1, location: L.SZONE, sequence: 2, position: 8 }])).toEqual([
      { k: 'set', from: { p: 1, zone: 'hand', seq: 0 }, to: { p: 1, zone: 'szone', seq: 2 } },
    ]);
  });

  it('Magia ativada da mão: o movimento sai como move antes da ativação', () => {
    expect(beats([mv(3, lp(0, L.HAND, 1), lp(0, L.SZONE, 0)), { type: T.CHAINING, code: 3, controller: 0, location: L.SZONE, sequence: 0, position: 1, chain_size: 1 }])).toEqual([
      { k: 'move', from: { p: 0, zone: 'hand', seq: 1 }, to: { p: 0, zone: 'szone', seq: 0 }, code: 3, why: 'other' },
      { k: 'activate', at: { p: 0, zone: 'szone', seq: 0 }, code: 3, p: 0 },
    ]);
  });

  it('movimento pendente sem invocação no mesmo lugar sai como move', () => {
    const b = beats([mv(1, lp(0, L.REMOVED, 0), lp(0, L.MZONE, 0)), { type: T.SUMMONING, code: 2, controller: 0, location: L.MZONE, sequence: 1, position: 1 }]);
    expect(b.map((x) => x.k)).toEqual(['move', 'summon']);
  });

  it('flip summon: invocação no próprio lugar', () => {
    expect(beats([{ type: T.FLIPSUMMONING, code: 8, controller: 0, location: L.MZONE, sequence: 4, position: 1 }])).toEqual([
      { k: 'summon', from: { p: 0, zone: 'mzone', seq: 4 }, to: { p: 0, zone: 'mzone', seq: 4 }, code: 8, how: 'flip' },
    ]);
  });

  it('posição: virar (reveal) e só mudar de posição', () => {
    const pos = (prev: number, now: number) => beats([{ type: T.POS_CHANGE, code: 8, controller: 1, location: L.MZONE, sequence: 0, prev_position: prev, position: now }])[0];
    expect(pos(8, 1)).toEqual({ k: 'pos', at: { p: 1, zone: 'mzone', seq: 0 }, code: 8, reveal: true, defense: false });
    expect(pos(8, 4)).toMatchObject({ reveal: true, defense: true });
    expect(pos(1, 4)).toMatchObject({ reveal: false, defense: true });
    expect(pos(4, 1)).toMatchObject({ reveal: false, defense: false });
  });

  it('corrente: ativação guarda o tamanho; resolução, negação e anulação', () => {
    const b = beats([
      { type: T.CHAINING, code: 1, controller: 0, location: L.SZONE, sequence: 0, position: 1, chain_size: 1 },
      { type: T.CHAINING, code: 2, controller: 1, location: L.SZONE, sequence: 1, position: 1, chain_size: 2 },
      { type: T.CHAIN_SOLVING, chain_size: 2 },
      { type: T.CHAIN_NEGATED, chain_size: 1 },
      { type: T.CHAIN_DISABLED, chain_size: 1 },
      { type: T.CHAIN_END },
      { type: T.CHAINING, code: 3, controller: 0, location: L.HAND, sequence: 0, position: 1, chain_size: 1 },
      { type: T.CHAIN_SOLVING, chain_size: 1 },
    ]);
    expect(b.filter((x) => x.k === 'chainSolve')).toEqual([
      { k: 'chainSolve', link: 2, of: 2, result: 'ok' },
      { k: 'chainSolve', link: 1, of: 2, result: 'negated' },
      { k: 'chainSolve', link: 1, of: 2, result: 'disabled' },
      { k: 'chainSolve', link: 1, of: 1, result: 'ok' },
    ]);
  });

  it('ataque: código consultado no motor; ataque direto sem alvo', () => {
    const ctx = newBeatCtx((l) => (l.sequence === 2 ? 77 : 0));
    expect(run([{ type: T.ATTACK, card: lp(0, L.MZONE, 2), target: lp(1, L.MZONE, 0) }], ctx)[0].beat).toEqual({
      k: 'attack', from: { p: 0, zone: 'mzone', seq: 2 }, to: { p: 1, zone: 'mzone', seq: 0 }, code: 77,
    });
    expect(beats([{ type: T.ATTACK, card: lp(1, L.MZONE, 0), target: null }])[0]).toMatchObject({ to: null });
  });

  it('LP: dano, cura e custo com sinal', () => {
    expect(beats([{ type: T.DAMAGE, player: 1, amount: 500 }, { type: T.RECOVER, player: 0, amount: 300 }, { type: T.PAY_LPCOST, player: 0, amount: 1000 }])).toEqual([
      { k: 'lp', p: 1, delta: -500, why: 'damage' }, { k: 'lp', p: 0, delta: 300, why: 'recover' }, { k: 'lp', p: 0, delta: -1000, why: 'cost' },
    ]);
  });

  it('equipamento, moeda, dado e fim', () => {
    expect(beats([
      { type: T.EQUIP, card: lp(0, L.SZONE, 1), target: lp(0, L.MZONE, 0) },
      { type: T.TOSS_COIN, player: 0, results: [true, false] },
      { type: T.TOSS_DICE, player: 1, results: [6] },
      { type: T.WIN, player: 1, reason: 0 },
    ])).toEqual([
      { k: 'equip', from: { p: 0, zone: 'szone', seq: 1 }, to: { p: 0, zone: 'szone', seq: 1 }, target: { p: 0, zone: 'mzone', seq: 0 }, code: 42 },
      { k: 'toss', what: 'coin', p: 0, results: [1, 0] },
      { k: 'toss', what: 'dice', p: 1, results: [6] },
      { k: 'win', p: 1 },
    ]);
  });

  it('movimentos consecutivos tocam juntos; dicas não quebram a sequência; outra mensagem quebra', () => {
    const steps = run([
      { type: T.CHAIN_SOLVING, chain_size: 1 },
      mv(1, lp(1, L.MZONE, 0), lp(1, L.GRAVE, 0), DESTROY | EFFECT),
      { type: T.HINT },
      mv(2, lp(1, L.MZONE, 1), lp(1, L.GRAVE, 1), DESTROY | EFFECT),
      { type: T.CHAIN_SOLVED, chain_size: 1 },
      mv(3, lp(0, L.SZONE, 0), lp(0, L.GRAVE, 0), 0x400),
    ]);
    expect(steps.map((s) => [s.beat.k, s.beat.k === 'move' ? s.beat.why : '', !!s.together])).toEqual([
      ['chainSolve', '', false], ['move', 'destroy', false], ['move', 'destroy', true], ['move', 'grave', false],
    ]);
  });

  it('mensagens sem acontecimento visível não geram beat', () => {
    expect(beats([{ type: T.SHUFFLE_HAND, player: 0, cards: [] }, { type: T.LPUPDATE, player: 0, lp: 100 }])).toEqual([]);
  });
});

describe('beatText', () => {
  const NAMES: Record<number, string> = { 1: 'Dragão Branco de Olhos Azuis', 2: 'Mago Negro' };
  const name = (c: number) => NAMES[c] ?? `#${c}`;
  const at = { p: 0, zone: 'mzone', seq: 0 } as const;
  const foe = { p: 1, zone: 'mzone', seq: 0 } as const;
  const t = (b: Beat) => beatText(b, name);

  it('os mesmos textos do narrador de antes', () => {
    expect(t({ k: 'turn', p: 1, n: 3 })).toEqual(['— Turno 3 (Oponente) —']);
    expect(t({ k: 'draw', p: 0, codes: [1, 2] })).toEqual(['Você comprou Dragão Branco de Olhos Azuis', 'Você comprou Mago Negro']);
    expect(t({ k: 'draw', p: 1, codes: [1, 2] })).toEqual(['Oponente comprou uma carta']);
    expect(t({ k: 'summon', from: at, to: foe, code: 2, how: 'special' })).toEqual(['Oponente invocou Mago Negro']);
    expect(t({ k: 'set', from: at, to: at })).toEqual(['Você baixou uma carta']);
    expect(t({ k: 'attack', from: foe, to: null, code: 1 })).toEqual(['Oponente ataca com Dragão Branco de Olhos Azuis']);
    expect(t({ k: 'activate', at, code: 2, p: 0 })).toEqual(['Você ativou Mago Negro']);
    expect(t({ k: 'lp', p: 1, delta: -1200, why: 'damage' })).toEqual(['Oponente perdeu 1200 LP']);
    expect(t({ k: 'lp', p: 1, delta: 500, why: 'recover' })).toEqual(['Oponente recuperou 500 LP']);
    expect(t({ k: 'lp', p: 0, delta: -1000, why: 'cost' })).toEqual(['Você pagou 1000 LP']);
    expect(t({ k: 'win', p: 0 })).toEqual(['Você venceu!']);
    expect(t({ k: 'win', p: 1 })).toEqual(['O oponente venceu.']);
  });

  it('beats sem texto hoje', () => {
    for (const b of [
      { k: 'summon', from: at, to: at, code: 1, how: 'flip' },
      { k: 'move', from: at, to: at, code: 1, why: 'destroy' },
      { k: 'pos', at, code: 1, reveal: true, defense: false },
      { k: 'chainSolve', link: 1, of: 1, result: 'ok' },
      { k: 'equip', from: at, to: at, target: at, code: 1 },
      { k: 'toss', what: 'coin', p: 0, results: [1] },
      { k: 'phase', phase: 4 },
    ] as Beat[]) expect(t(b)).toEqual([]);
  });
});

describe('locKey', () => {
  it('mão e zonas levam a sequência; pilhas não', () => {
    expect(locKey({ p: 0, zone: 'hand', seq: 3 })).toBe('0:hand:3');
    expect(locKey({ p: 1, zone: 'mzone', seq: 0 })).toBe('1:mzone:0');
    expect(locKey({ p: 0, zone: 'szone', seq: 5 })).toBe('0:szone:5');
    expect(locKey({ p: 1, zone: 'grave', seq: 7 })).toBe('1:grave');
    expect(locKey({ p: 0, zone: 'deck', seq: 39 })).toBe('0:deck');
    expect(locKey({ p: 0, zone: 'removed', seq: 1 })).toBe('0:removed');
    expect(locKey({ p: 1, zone: 'extra', seq: 0 })).toBe('1:extra');
    expect(locKey({ p: 0, zone: 'none', seq: 0 })).toBe('0:none');
  });
  it('a mesma chave sai da posição do motor (o que a tela usa) e do beat', () => {
    expect(locKey(toLoc({ controller: 1, location: L.SZONE, sequence: 2 }))).toBe('1:szone:2');
    expect(locKey(toLoc({ controller: 0, location: L.GRAVE, sequence: 4 }))).toBe('0:grave');
  });
});
