import { describe, expect, it } from 'vitest';
import { OcgMessageType, OcgResponseType, SelectIdleCMDAction } from 'ocgcore-wasm';
import { Narrator } from './narrator';
import type { DriverOut } from './driver';
import { HAS_ENGINE_DATA, hand, mon, normalWithAtk, puzzle, st } from './__testing__/duel';

const AXE = 40619825;
const CIRCLE = 18807108;

describe.skipIf(!HAS_ENGINE_DATA)('retrato: equipamento, alvo e controle', () => {
  it('Machado do Desespero equipado liga as duas cartas', async () => {
    const a = normalWithAtk(1400);
    const { driver } = await puzzle([mon(0, normalWithAtk(1800)), mon(1, a), hand(1, AXE)]);
    const b = new Narrator().snapshot(driver.session);
    const axe = b.players[1].szone.find((c) => c?.code === AXE);
    expect(axe?.links?.[0]).toMatchObject({ kind: 'equip', dir: 'to' });
    const m = b.players[1].mzone.find((c) => c?.links?.length);
    expect(m?.links?.[0]).toMatchObject({ kind: 'equip', dir: 'by', code: AXE });
  });

  it('Círculo da Profecia marca o monstro preso como alvo', async () => {
    // O jogador tem o Círculo baixado; a CPU joga o turno 2 e, no turno 3, o jogador o ativa no monstro dela.
    const { driver, out: first } = await puzzle([st(0, CIRCLE), mon(1, normalWithAtk(1800))]);
    let out: DriverOut = first;
    for (let i = 0; i < 10 && out.t === 'prompt' && out.msg.type === OcgMessageType.SELECT_CHAIN; i++) out = driver.respond({ type: OcgResponseType.SELECT_CHAIN, index: null });
    if (out.t !== 'prompt' || out.msg.type !== OcgMessageType.SELECT_IDLECMD) throw new Error('esperava a vez do jogador');
    const idx = out.msg.activates.findIndex((a) => a.code === CIRCLE);
    expect(idx).toBeGreaterThanOrEqual(0);
    let r = driver.respond({ type: OcgResponseType.SELECT_IDLECMD, action: SelectIdleCMDAction.SELECT_ACTIVATE, index: idx });
    for (let i = 0; i < 10 && r.t === 'prompt' && r.msg.type !== OcgMessageType.SELECT_IDLECMD; i++) {
      const m = r.msg;
      if (m.type === OcgMessageType.SELECT_CARD) r = driver.respond({ type: OcgResponseType.SELECT_CARD, indicies: [0] });
      else if (m.type === OcgMessageType.SELECT_CHAIN) r = driver.respond({ type: OcgResponseType.SELECT_CHAIN, index: null });
      else throw new Error(`prompt ${OcgMessageType[m.type]}`);
    }
    const b = new Narrator().snapshot(driver.session);
    const circle = b.players[0].szone.find((c) => c?.code === CIRCLE);
    expect(circle?.links?.[0]).toMatchObject({ kind: 'target', dir: 'to', controller: 1 });
    expect(b.players[1].mzone.find(Boolean)?.links?.[0]).toMatchObject({ kind: 'target', dir: 'by', code: CIRCLE, controller: 0 });
  });
});
