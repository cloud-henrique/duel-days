// Modelo do Tier 4 e do duelo final (change tier4-finais: specs elenco-tier4, progressao-por-tiers, campanha e
// economia-dp), com os dados reais do Tier 4.
import { describe, expect, it } from 'vitest';
import { championScene } from './bond';
import { awaitsNextUpdate } from './calendar';
import { DIALOGUE, TIERS, tierByNumber } from './data/types';
import { cpuFor } from './decks';
import { postDuelScene, preDuelScene } from './encounter';
import { finalStatus, placements, present, tierProgress } from './map';
import { applyDuel } from './rewards';
import { collectionListing, packByKey, price } from './packs';
import { newCampaign, type CampaignState, type Period } from './state';
import { currentTier, isFinalAvailable, regularsOf, tierCleared } from './tiers';

const T4 = { regulars: ['ishizu', 'odion', 'yamibakura', 'marik'], boss: 'yamimarik', final: 'yamiyugi' } as const;
const SLIFER = 10000020;
const win = { result: 'win' as const, turns: 12, lifePoints: 3000 };
const below4 = TIERS.filter(t => t.number < 4);
/** O Tier 4 aberto (os tiers de baixo vencidos por inteiro; o Kaiba no dia 20), mais as vitórias de `wins`. */
function inTier4(wins: string[] = [], extra: Partial<CampaignState> = {}): CampaignState {
  const keys = [...below4.flatMap(t => t.duelists.map(d => d.key)), ...wins];
  return {
    ...newCampaign(7),
    day: 24,
    period: 0,
    victories: Object.fromEntries(keys.map(k => [k, 1])),
    defeatedBosses: below4.map(t => t.number),
    bossDefeatedOn: { 1: 5, 2: 12, 3: 20 },
    ...extra,
  };
}
/** Com o Yami Marik vencido (o duelo final liberado). */
const finalOpen = (extra: Partial<CampaignState> = {}) =>
  inTier4([...T4.regulars, T4.boss], {
    defeatedBosses: [1, 2, 3, 4],
    bossDefeatedOn: { 1: 5, 2: 12, 3: 20, 4: 26 },
    day: 26,
    period: 1,
    ...extra,
  });

describe('Tier 4: comuns, chefe e duelo final', () => {
  it('o duelo final não conta entre os comuns nem para fechar o tier', () => {
    const t4 = tierByNumber(4)!;
    expect(regularsOf(t4).map(d => d.key)).toEqual([...T4.regulars]);
    const s = finalOpen();
    expect(tierCleared(s, t4)).toBe(true);
    expect(tierProgress(s)).toMatchObject({ number: 4, beaten: 4, total: 4 });
  });

  it('o Kaiba vencido com o Tier 3 inteiro abre o Tier 4', () => {
    expect(currentTier(inTier4()).number).toBe(4);
  });

  it('o Yami Yugi só aparece depois do Yami Marik vencido', () => {
    const before = inTier4([...T4.regulars], { day: 25 });
    const t4 = tierByNumber(4)!;
    expect(isFinalAvailable(before, t4)).toBe(false);
    for (const period of [0, 1, 2] as Period[])
      expect(present({ ...before, period }).some(d => d.key === T4.final)).toBe(false);
    expect(present(before).some(d => d.key === T4.boss)).toBe(true);
    const r = applyDuel(before, T4.boss, 'regular', win);
    expect(r.reward.defeatedBossForFirstTime).toBe(true);
    expect(isFinalAvailable(r.state, t4)).toBe(true);
    expect(present(r.state).some(d => d.key === T4.final)).toBe(true);
  });

  it('o duelo final joga no perfil de chefe; os comuns do T4, no comum', () => {
    expect(cpuFor(T4.final)).toBe('chefe');
    expect(cpuFor(T4.boss)).toBe('chefe');
    expect(cpuFor('ishizu')).toBe('comum');
  });

  it('último tier: sem aviso de atualização', () => {
    expect(awaitsNextUpdate(finalOpen())).toBe(false);
    expect(awaitsNextUpdate(finalOpen({ champion: { day: 27, scene: 'generic' } }))).toBe(false);
  });
});

describe('Slifer na 1ª vitória e o campeão', () => {
  it('a 1ª vitória dá o Slifer, grava o campeão e devolve a cena; a 2ª e a 5ª não repetem', () => {
    const s = finalOpen({ bondEventsDone: { joey: 5, tea: 3 } });
    const r1 = applyDuel(s, T4.final, 'regular', win);
    expect(r1.reward.cards.filter(c => c.kind === 'signature').map(c => c.id)).toEqual([SLIFER]);
    expect(r1.reward.cards.find(c => c.kind === 'signature')?.isNew).toBe(true);
    expect(r1.reward.champion).toBe('joey');
    expect(r1.state.champion).toEqual({ day: 26, scene: 'joey' });
    const r2 = applyDuel(r1.state, T4.final, 'regular', win);
    expect(r2.reward.champion).toBeNull();
    expect(r2.reward.cards.some(c => c.kind === 'signature')).toBe(false);
    expect(r2.state.champion).toEqual({ day: 26, scene: 'joey' });
    const r5 = applyDuel(
      { ...r2.state, victories: { ...r2.state.victories, [T4.final]: 4 } },
      T4.final,
      'regular',
      win,
    );
    expect(r5.reward.cards.some(c => c.kind === 'signature')).toBe(false);
  });

  it('a assinatura dos outros continua na 5ª vitória', () => {
    const s = inTier4([], { victories: { ...inTier4().victories, marik: 4 } });
    const r = applyDuel(s, 'marik', 'regular', win);
    expect(r.reward.cards.some(c => c.kind === 'signature')).toBe(true);
    expect(r.reward.champion).toBeNull();
  });

  it('derrota para o duelo final: nada de campeão', () => {
    const r = applyDuel(finalOpen(), T4.final, 'regular', { result: 'lose', turns: 9, lifePoints: 0 });
    expect(r.state.champion).toBeUndefined();
    expect(r.reward.champion).toBeNull();
  });

  it('entrada e derrota de chefe só até a primeira vitória sobre o final', () => {
    const dl = DIALOGUE.duelists[T4.final];
    const s = finalOpen();
    expect(preDuelScene(s, T4.final, 'regular')).toBe(dl.bossEntrance);
    expect(postDuelScene(s, T4.final, 'win', 'regular')).toBe(dl.bossDefeat);
    const after = applyDuel(s, T4.final, 'regular', win).state;
    expect(preDuelScene(after, T4.final, 'regular')).not.toBe(dl.bossEntrance);
  });

  it('cena de campeão: o amigo do epílogo (eventos, depois afinidade) ou a genérica', () => {
    expect(championScene(finalOpen({ bondEventsDone: { joey: 5, tea: 3 } }))).toBe('joey');
    expect(championScene(finalOpen({ bondEventsDone: { joey: 3, tea: 3 }, affinity: { joey: 50, tea: 90 } }))).toBe(
      'tea',
    );
    expect(championScene(finalOpen())).toBe('generic');
  });

  it('progresso: "Final · vença" depois do Yami Marik e o título depois do campeão', () => {
    expect(finalStatus(inTier4([...T4.regulars]))).toBeNull();
    expect(finalStatus(finalOpen())).toBe('Final · vença Yami Yugi');
    expect(finalStatus(finalOpen({ champion: { day: 27, scene: 'joey' } }))).toBe(
      'Campeão da Batalha da Cidade · dia 27',
    );
  });
});

describe('loja do Tier 4', () => {
  const listing = (s: CampaignState) => Object.fromEntries(collectionListing(s).map((e) => [e.pack.key, e.lock]));

  it('AST e SOD a 350 DP', () => {
    expect(price(packByKey('ast')!)).toBe(350);
    expect(price(packByKey('sod')!)).toBe(350);
  });

  it('no Tier 3, AST e SOD bloqueados com "Tier 4" até vencer o Kaiba', () => {
    const below3 = TIERS.filter((t) => t.number < 3);
    const s: CampaignState = {
      ...newCampaign(7), day: 20,
      victories: Object.fromEntries(below3.flatMap((t) => t.duelists.map((d) => [d.key, 1]))),
      defeatedBosses: [1, 2], bossDefeatedOn: { 1: 5, 2: 12 },
    };
    const l = listing(s);
    for (const k of ['ast', 'sod']) expect(l[k], k).toEqual({ kind: 'tier', tier: 4, boss: 'Kaiba' });
  });

  it('Kaiba vencido no dia 23: no dia 24, AST à venda, SOD no dia 25, e as 10 antigas à venda', () => {
    const l = listing(inTier4([], { day: 24, bossDefeatedOn: { 1: 5, 2: 12, 3: 23 } }));
    expect(l.ast).toBeNull();
    expect(l.sod).toEqual({ kind: 'day', day: 25 });
    for (const k of ['lob', 'mrd', 'mrl', 'psv', 'lon', 'lod', 'pgd', 'mfc', 'dcr', 'ioc']) expect(l[k], k).toBeNull();
  });

  it('pacote-prêmio do Yami Marik no dia 28: a coleção mais recente à venda (SOD)', () => {
    const r = applyDuel(inTier4([...T4.regulars], { day: 28 }), T4.boss, 'regular', win);
    expect(r.reward.prizePack).toBe('sod');
  });
});

describe('mapa cheio no Tier 4', () => {
  /** Todos liberados (Yugi, Pegasus, Kaiba, Yami Marik e Yami Yugi): os períodos em que os 4 comuns do T4 aparecem. */
  function fullMaps(): CampaignState[] {
    const out: CampaignState[] = [];
    for (let seed = 1; seed <= 40 && out.length < 25; seed++)
      for (let day = 26; day <= 30; day++)
        for (const period of [0, 1, 2] as Period[]) {
          const s = finalOpen({ seed, day, period });
          if (present(s).length === 22) out.push(s);
        }
    return out;
  }
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot((a.x - b.x) * 2, a.y - b.y);

  it('22 cabeças, nenhuma encostada em outra, dentro do panorama', () => {
    const maps = fullMaps();
    expect(maps.length).toBeGreaterThan(5);
    for (const s of maps) {
      const pts = placements(s).map(p => p.point);
      expect(pts).toHaveLength(22);
      for (const p of pts) {
        expect(p.x).toBeGreaterThanOrEqual(0.03);
        expect(p.x).toBeLessThanOrEqual(0.97);
      }
      let min = Infinity;
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) min = Math.min(min, dist(pts[i], pts[j]));
      expect(min).toBeGreaterThanOrEqual(0.15);
    }
  });

  it('cada chefe na faixa do tier dele; o Yami Marik e o Yami Yugi perto do centro', () => {
    for (const s of fullMaps().slice(0, 10)) {
      const off = Object.fromEntries(placements(s).map(p => [p.duelist.key, Math.abs(p.point.x - 0.5)]));
      expect(off.yamimarik).toBeLessThanOrEqual(0.12);
      expect(off.yamiyugi).toBeLessThanOrEqual(0.12);
      expect(off.kaiba).toBeGreaterThan(0.12);
      expect(off.pegasus).toBeGreaterThan(off.kaiba);
      expect(off.yugi).toBeGreaterThan(off.pegasus);
    }
  });
});
