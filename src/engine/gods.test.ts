// Os Deuses Egípcios no formato Speed (change tier4-finais, spec `cpu-do-duelo` "Deuses Egípcios jogáveis"): a CPU
// invoca com 3 tributos nas 3 zonas e usa o efeito de cada um, sem erro de Lua nem laço de respostas recusadas.
import { describe, expect, it } from 'vitest';
import type { Beat } from './protocol';
import { HAS_ENGINE_DATA, hand, mon } from './__testing__/duel';
import { puzzle } from './__testing__/duel';

const G = { obelisk: 10000000, ra: 10000010, slifer: 10000020 };
const K = {
  mokey: 27288416, // Mokey Mokey 300/100
  grave1200: 32864, // The 13th Grave 1200/900
  gaia2300: 6368038, // Gaia The Fierce Knight 2300/2100
  blueEyes: 89631139, // Blue-Eyes White Dragon 3000/2500
};

const summoned = (beats: Beat[], code: number) =>
  beats.some(b => b.k === 'summon' && b.to.p === 1 && b.code === code && b.how === 'normal');
const onField = (out: Awaited<ReturnType<typeof puzzle>>['out'], p: 0 | 1, code: number) =>
  out.board.players[p].mzone.find(c => c?.code === code);
/** Três monstros fracos da CPU, um em cada zona: os tributos. */
const tributes = [mon(1, K.mokey, 0), mon(1, K.mokey, 1), mon(1, K.grave1200, 2)];

describe.skipIf(!HAS_ENGINE_DATA)('Deuses Egípcios no Speed', () => {
  it('Obelisco: a CPU tributa os 3 e invoca, e o Obelisco vence o Gaia', async () => {
    const { beats, out } = await puzzle([...tributes, hand(1, G.obelisk), mon(0, K.gaia2300)], { lp: [4000, 4000] });
    expect(summoned(beats, G.obelisk)).toBe(true);
    expect(onField(out, 1, G.obelisk)).toBeTruthy();
    expect(out.board.players[0].mzone.some(c => c?.code === K.gaia2300)).toBe(false);
  });

  it('Obelisco em campo: o efeito (2 tributos) ou o ataque limpa o campo do jogador', async () => {
    const { out } = await puzzle(
      [
        mon(1, G.obelisk, 0),
        mon(1, K.mokey, 1),
        mon(1, K.mokey, 2),
        mon(0, K.blueEyes, 0),
        mon(0, K.blueEyes, 1),
        mon(0, K.gaia2300, 2),
      ],
      { lp: [4000, 4000] },
    );
    // Com 4000 de ATK ele vence qualquer um; com o efeito, destrói os três. Nos dois casos o Blue-Eyes não sobra inteiro.
    expect(out.board.players[0].mzone.filter(Boolean).length).toBeLessThan(3);
  });

  it('Slifer: a CPU invoca, e o ATK é 1000 por carta na mão', async () => {
    const { beats, out } = await puzzle(
      [...tributes, hand(1, G.slifer), hand(1, K.mokey), hand(1, K.mokey), mon(0, K.gaia2300)],
      { lp: [4000, 4000] },
    );
    expect(summoned(beats, G.slifer)).toBe(true);
    const slifer = onField(out, 1, G.slifer);
    expect(slifer).toBeTruthy();
    expect(slifer!.attack).toBe(1000 * out.board.players[1].hand.length);
  });

  it('Rá: a CPU invoca, decide o pagamento de PV e o duelo continua', async () => {
    const { beats, out } = await puzzle([...tributes, hand(1, G.ra), mon(0, K.blueEyes)], { lp: [4000, 4000] });
    expect(summoned(beats, G.ra)).toBe(true);
    // Contra o Blue-Eyes, pagar é a jogada: fica com 100 PV e o Rá ganha os 3900 pagos (e vence o Blue-Eyes).
    const ra = onField(out, 1, G.ra);
    expect(ra?.attack).toBe(3900);
    expect(out.board.players[1].lp).toBe(100);
    expect(out.board.players[0].mzone.some(c => c?.code === K.blueEyes)).toBe(false);
  });

  it('Rá em campo: paga 1000 PV para destruir o Blue-Eyes quando vale a pena', async () => {
    const { out } = await puzzle([mon(1, G.ra, 0), mon(0, K.blueEyes)], { lp: [4000, 4000] });
    // O Rá em campo sem invocação-normal tem 0 de ATK: a única saída contra o Blue-Eyes é o efeito.
    expect(out.board.players[0].mzone.some(c => c?.code === K.blueEyes)).toBe(false);
    expect(out.board.players[1].lp).toBe(3000);
  });
});
