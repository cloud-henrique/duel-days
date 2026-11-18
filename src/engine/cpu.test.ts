// Cenários da spec `cpu-do-duelo` em quebra-cabeças: o jogador passa o turno 1 e a CPU joga o turno 2.
import { describe, expect, it } from 'vitest';
import { OcgLocation, OcgMessageType, OcgPosition, OcgResponseType, type OcgMessage } from 'ocgcore-wasm';
import type { Beat } from './protocol';
import { decide } from './search';
import { HAS_ENGINE_DATA, hand, mon, puzzle, st } from './__testing__/duel';
import type { PlacedCard } from './session';

const K = {
  dark1800: 11321183, // Dark Blade 1800/1500
  ox1700: 5053103, // Battle Ox 1700/1000
  overdrive1600: 2311603, // Overdrive 1600/1500
  kojikocy1500: 1184620, // Kojikocy 1500/1200
  grave1200: 32864, // The 13th Grave 1200/900
  gaia2300: 6368038, // Gaia The Fierce Knight 2300/2100
  mokey: 27288416,
  metalmorph: 68540058,
  mirrorForce: 44095762,
  doomed: 79759861, // Tribute to The Doomed
  wasteland: 23424603,
  terraforming: 73628505,
  kuriboh: 40640057,
  pot: 55144522,
};

const cpuAttacks = (beats: Beat[]) => beats.filter((b): b is Extract<Beat, { k: 'attack' }> => b.k === 'attack' && b.from.p === 1);
const deck = (p: 0 | 1, code: number): PlacedCard => ({ p, code, location: OcgLocation.DECK, seq: 0 });

describe.skipIf(!HAS_ENGINE_DATA)('CPU: jogadas escolhidas pelo resultado', () => {
  it('Ataque que vence: 1800 ataca o 1200 em ataque', async () => {
    const { beats, out } = await puzzle([mon(1, K.dark1800), mon(0, K.grave1200)]);
    const atk = cpuAttacks(beats).filter((a) => a.code === K.dark1800);
    expect(atk.length).toBe(1);
    expect(atk[0].to).toMatchObject({ p: 0, zone: 'mzone' });
    expect(out.board.players[0].mzone.filter(Boolean)).toEqual([]);
  });

  it('Não ataca para perder: 1200 não ataca o 2300', async () => {
    const { beats } = await puzzle([mon(1, K.grave1200), mon(0, K.gaia2300)]);
    expect(cpuAttacks(beats)).toEqual([]);
  });

  it('Ataque direto: com o campo do jogador vazio, todos atacam diretamente', async () => {
    const { beats, out } = await puzzle([mon(1, K.dark1800, 0), mon(1, K.ox1700, 1)]);
    // (O Mokey Mokey comprado também é invocado e ataca: está certo.)
    const atk = cpuAttacks(beats).filter((a) => a.code === K.dark1800 || a.code === K.ox1700);
    expect(atk.length).toBe(2);
    expect(atk.every((a) => a.to === null)).toBe(true);
    expect(out.board.players[0].lp).toBeLessThanOrEqual(8000 - 1800 - 1700);
  });

  it('Mão cheia: invoca o monstro que vence e ataca', async () => {
    const { beats } = await puzzle([hand(1, K.dark1800), hand(1, K.mokey), hand(1, K.mokey), mon(0, K.grave1200)]);
    expect(beats.some((b) => b.k === 'summon' && b.to.p === 1 && b.code === K.dark1800)).toBe(true);
    expect(cpuAttacks(beats).length).toBe(1);
  });
});

describe.skipIf(!HAS_ENGINE_DATA)('CPU: alvos e jogadas inúteis', () => {
  it('Equipamento que fortalece: Metalmorph vai para o monstro da CPU', async () => {
    // A CPU pode ativá-la já no turno do jogador (Armadilha baixada): olha todos os beats.
    const { all } = await puzzle([mon(1, K.kojikocy1500), st(1, K.metalmorph), mon(0, K.overdrive1600)]);
    const eq = all.filter((b): b is Extract<Beat, { k: 'equip' }> => b.k === 'equip');
    expect(eq.length).toBe(1);
    expect(eq[0].target.p).toBe(1);
  });

  it('Efeito que destrói: Tribute to The Doomed destrói o monstro do jogador', async () => {
    const { out } = await puzzle([mon(1, K.grave1200), hand(1, K.doomed), hand(1, K.mokey), mon(0, K.gaia2300)]);
    expect(out.board.players[0].mzone.filter(Boolean)).toEqual([]);
    expect(out.board.players[1].mzone.some((c) => c?.code === K.grave1200)).toBe(true);
  });

  it('Campo já ativo: não busca outra Wasteland com Terraforming', async () => {
    const { beats } = await puzzle([
      st(1, K.wasteland, 5, OcgPosition.FACEUP_ATTACK), hand(1, K.terraforming), deck(1, K.wasteland), mon(1, K.grave1200),
    ]);
    expect(beats.some((b) => b.k === 'activate' && b.code === K.terraforming)).toBe(false);
  });
});

describe.skipIf(!HAS_ENGINE_DATA)('CPU: honestidade e chefe', () => {
  it('Comum: mesma jogada com mãos e viradas diferentes do jogador', async () => {
    const common = [mon(1, K.dark1800, 0), mon(1, K.ox1700, 1), mon(0, K.grave1200)];
    const a = await puzzle([...common, st(0, K.mirrorForce), hand(0, K.kuriboh)]);
    const b = await puzzle([...common, st(0, K.pot), hand(0, K.mokey)]);
    const strip = (bs: Beat[]) => bs.filter((x) => x.k !== 'draw');
    expect(strip(a.beats)).toEqual(strip(b.beats));
  });

  it('Chefe: conhece a Mirror Force virada e não ataca para perder o campo', async () => {
    const placed = [mon(1, K.dark1800, 0), mon(1, K.ox1700, 1), mon(0, K.overdrive1600), st(0, K.mirrorForce)];
    // O jogador ativa a Mirror Force se a CPU atacar.
    const respond0 = (m: OcgMessage) => {
      if (m.type === OcgMessageType.SELECT_CHAIN) return { type: OcgResponseType.SELECT_CHAIN, index: m.selects.length ? 0 : null } as const;
      if (m.type === OcgMessageType.SELECT_EFFECTYN) return { type: OcgResponseType.SELECT_EFFECTYN, yes: true } as const;
      throw new Error(`prompt inesperado ${OcgMessageType[m.type]}`);
    };
    const { beats } = await puzzle(placed, { cpu: 'chefe', respond0 });
    expect(cpuAttacks(beats)).toEqual([]);
  });

  it('Prompt sem escolha: responde sem simular', async () => {
    const { driver } = await puzzle([mon(1, K.grave1200)], { maxSims: 0 });
    const m = { type: OcgMessageType.SELECT_POSITION, player: 1, code: K.dark1800, positions: OcgPosition.FACEUP_ATTACK } as OcgMessage;
    const { response, stats } = decide(m, driver.fork, { ...driver.profile, maxSims: 64, maxMs: Infinity }, { turn: 0, activating: null, attackTarget: null, used: [] }, { turn: 2, phase: 4 });
    expect(response).toMatchObject({ position: OcgPosition.FACEUP_ATTACK });
    expect(stats.sims).toBe(0);
  });
});

describe.skipIf(!HAS_ENGINE_DATA)('política barata (sem simulação)', () => {
  const cheap = { maxSims: 0 };
  it('ataca o que vence, não ataca o que perde', async () => {
    const win = await puzzle([mon(1, K.dark1800), mon(0, K.grave1200)], cheap);
    expect(cpuAttacks(win.beats).filter((a) => a.code === K.dark1800 && a.to?.zone === 'mzone').length).toBe(1);
    const lose = await puzzle([mon(1, K.grave1200), mon(0, K.gaia2300)], cheap);
    expect(cpuAttacks(lose.beats)).toEqual([]);
  });
  it('ataca diretamente com o campo do jogador vazio', async () => {
    const { beats } = await puzzle([mon(1, K.dark1800, 0), mon(1, K.ox1700, 1)], cheap);
    expect(cpuAttacks(beats).filter((a) => a.code !== K.mokey).every((a) => a.to === null)).toBe(true);
    expect(cpuAttacks(beats).filter((a) => a.code !== K.mokey).length).toBe(2);
  });
  it('equipa a Metalmorph no próprio monstro', async () => {
    const { all } = await puzzle([mon(1, K.kojikocy1500), st(1, K.metalmorph), mon(0, K.overdrive1600)], cheap);
    const eq = all.filter((b): b is Extract<Beat, { k: 'equip' }> => b.k === 'equip');
    expect(eq.map((e) => e.target.p)).toEqual([1]);
  });
});
