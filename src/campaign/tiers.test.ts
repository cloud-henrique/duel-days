// Cenários dos specs da change `campanha-tiers` (progressao-por-tiers, elenco-tier2, campanha e economia-dp).
import { describe, expect, it } from 'vitest';
import { awaitsNextUpdate } from './calendar';
import { FRIENDS, isPresent, placements, present, tierProgress } from './map';
import { collectionListing, collectionPacks } from './packs';
import { applyDuel, duelDP } from './rewards';
import { newCampaign, type CampaignState, type Period } from './state';
import { currentTier, isTierOpen, tierOpenDay } from './tiers';
import { DIALOGUE, TIERS } from './data/types';
import { greetingScene, postDuelScene, preDuelScene } from './encounter';
import { fillText } from './text';

const at = (day: number, period: Period = 0, extra: Partial<CampaignState> = {}): CampaignState =>
  ({ ...newCampaign(42), day, period, ...extra });
const T1 = ['tristan', 'tea', 'joey', 'bakura'];
const T2 = ['weevil', 'rex', 'mako', 'keith', 'mai'];
const beat = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, 1]));
const win = { result: 'win' as const, turns: 12, lifePoints: 3000 };
const listing = (s: CampaignState) => Object.fromEntries(collectionListing(s).map((e) => [e.pack.key, e.lock]));

describe('progressão por tiers', () => {
  it('começa no Tier 1', () => {
    expect(currentTier(newCampaign(1)).number).toBe(1);
  });

  it('Yugi vencido na tarde do dia 5: pacote-prêmio e Tier 2 a partir da noite', () => {
    const s = at(5, 1, { victories: beat(T1) });
    const r = applyDuel(s, 'yugi', 'regular', win);
    expect(r.reward.prizePack).not.toBeNull();
    expect(r.state.unopenedPacks).toContain(r.reward.prizePack);
    expect(r.state).toMatchObject({ day: 5, period: 2 });
    expect(currentTier(r.state).number).toBe(2);
    expect(r.state.bossDefeatedOn).toEqual({ 1: 5 });
    expect(tierOpenDay(r.state, 2)).toBe(5);
  });

  it('prazo do Tier 1: manhã do dia 8 abre o Tier 2 sem prêmio, e o Yugi continua', () => {
    const s = at(8, 0, { victories: beat(T1) });
    expect(currentTier(s).number).toBe(2);
    expect(tierOpenDay(s, 2)).toBe(8);
    expect(isPresent(s, 'yugi')).toBe(true);
    const r = applyDuel(s, 'yugi', 'regular', win);
    expect(r.reward.defeatedBossForFirstTime).toBe(true);
    expect(r.reward.prizePack).toBeNull();
  });

  it('tier sem conteúdo: Pegasus vencido no dia 12 dá prêmio, o tier continua o 2 e o progresso avisa', () => {
    const s = at(12, 0, { victories: beat([...T1, ...T2]) });
    const r = applyDuel(s, 'pegasus', 'regular', win);
    expect(r.reward.prizePack).not.toBeNull();
    expect(currentTier(r.state).number).toBe(2);
    expect(isTierOpen(r.state, 3)).toBe(false);
    expect(awaitsNextUpdate(r.state)).toBe(true);
    expect(awaitsNextUpdate(at(12))).toBe(false);
    expect(currentTier(at(20)).number).toBe(2);
  });

  it('cabeçalho no Tier 2 com Rex e Weevil vencidos: "2/5"', () => {
    const tp = tierProgress(at(9, 0, { victories: beat(['rex', 'weevil']) }));
    expect(tp).toMatchObject({ number: 2, name: 'Reino dos Duelistas', beaten: 2, total: 5 });
  });

  it('save antigo no dia 12 sem o Yugi: Tier 2, duelistas do T2 no mapa, caixas a partir do dia 8', () => {
    const old = at(12);
    delete (old as Partial<CampaignState>).bossDefeatedOn;
    expect(currentTier(old).number).toBe(2);
    expect(present(old).some((d) => T2.includes(d.key))).toBe(true);
    expect(tierOpenDay(old, 2)).toBe(8);
  });

  it('save antigo no dia 5 com o Yugi vencido: Tier 2, LON já, LOD e PGD nos dias 10 e 12', () => {
    const old = at(5, 0, { defeatedBosses: [1], victories: beat([...T1, 'yugi']) });
    delete (old as Partial<CampaignState>).bossDefeatedOn;
    expect(currentTier(old).number).toBe(2);
    const l = listing(old);
    expect(l.lon).toBeNull();
    expect(l.lod).toEqual({ kind: 'day', day: 10 });
    expect(l.pgd).toEqual({ kind: 'day', day: 12 });
  });
});

describe('mapa por tiers', () => {
  it('antes do Tier 2, nenhum duelista do T2', () => {
    for (const p of [0, 1, 2] as Period[]) expect(present(at(4, p)).some((d) => T2.includes(d.key))).toBe(false);
  });

  it('no Tier 2: 2 a 4 do T2 e 1 a 2 amigos do T1, em pontos diferentes, reproduzível', () => {
    for (let day = 8; day <= 14; day++) for (const p of [0, 1, 2] as Period[]) {
      const s = at(day, p);
      const here = present(s);
      const t2 = here.filter((d) => T2.includes(d.key)).length;
      const friends = here.filter((d) => FRIENDS.some((f) => f.key === d.key)).length;
      expect(t2).toBeGreaterThanOrEqual(2); expect(t2).toBeLessThanOrEqual(4);
      expect(friends).toBeGreaterThanOrEqual(1); expect(friends).toBeLessThanOrEqual(2);
      const pts = placements(s).map((x) => `${x.point.x},${x.point.y}`);
      expect(new Set(pts).size).toBe(here.length);
      expect(placements(s)).toEqual(placements(at(day, p)));
    }
  });

  it('o Pegasus aparece depois dos 5 comuns do T2 vencidos', () => {
    const four = at(10, 0, { victories: beat(T2.slice(0, 4)) });
    expect(isPresent(four, 'pegasus')).toBe(false);
    const all = at(10, 0, { victories: beat(T2) });
    expect(isPresent(all, 'pegasus')).toBe(true);
    expect(tierProgress(all).boss).toBe('Pegasus está esperando!');
  });
});

describe('economia por tiers', () => {
  it('vitória no Tier 2: Rex no turno 12 com 5000 LP paga 480 DP', () => {
    expect(duelDP({ result: 'win', turns: 12, lifePoints: 5000 }, 2).total).toBe(480);
    expect(duelDP({ result: 'lose', turns: 12, lifePoints: 0 }, 2).total).toBe(60);
  });

  it('amigo do Tier 1 durante o Tier 2 paga a base do Tier 1', () => {
    const r = applyDuel(at(9), 'joey', 'regular', { result: 'win', turns: 12, lifePoints: 100 });
    expect(r.reward.baseDP).toBe(300);
    const k = applyDuel(at(9), 'keith', 'regular', { result: 'win', turns: 12, lifePoints: 100 });
    expect(k.reward.baseDP).toBe(400);
  });

  it('assinatura do Tier 2: 10ª vitória sobre o Keith dá o Barrel Dragon', () => {
    const r = applyDuel(at(9, 0, { victories: { keith: 9 } }), 'keith', 'regular', win);
    expect(r.reward.cards.find((c) => c.kind === 'signature')?.id).toBe(81480460);
  });

  it('antes do dia 3, o MRL aparece bloqueado com "Dia 3"', () => {
    expect(listing(at(2)).mrl).toEqual({ kind: 'day', day: 3 });
    expect(listing(at(3)).mrl).toBeNull();
    expect(listing(at(5)).psv).toBeNull();
  });

  it('Tier 2 adiantado: Yugi no dia 5, manhã do dia 6 com LON, LOD no dia 7 e PGD no 9', () => {
    const s = applyDuel(at(5, 2, { victories: beat(T1) }), 'yugi', 'regular', win).state;
    expect(s).toMatchObject({ day: 6, period: 0 });
    const l = listing(s);
    expect(l.lon).toBeNull();
    expect(l.lod).toEqual({ kind: 'day', day: 7 });
    expect(l.pgd).toEqual({ kind: 'day', day: 9 });
    for (const k of ['lob', 'mrd', 'mrl', 'psv']) expect(l[k], k).toBeNull();
  });

  it('próximo tier na vitrine: no dia 4, LON, LOD e PGD bloqueados com "Tier 2 · dia 8"', () => {
    const l = listing(at(4));
    for (const k of ['lon', 'lod', 'pgd']) expect(l[k], k).toEqual({ kind: 'tier', tier: 2, day: 8 });
    expect(collectionPacks(at(4)).map((p) => p.key)).not.toContain('lon');
  });
});

describe('falas do Tier 2', () => {
  it('primeiro encontro com o Rex: a saudação de primeiro encontro; depois, a comum', () => {
    const s = at(9);
    expect(DIALOGUE.duelists.rex.firstGreeting).toContain(greetingScene(s, 'rex', true));
    expect(DIALOGUE.duelists.rex.greeting).toContain(greetingScene({ ...s, met: ['rex'] }, 'rex'));
  });

  it('entrada e derrota do Pegasus só até a primeira vitória', () => {
    const s = at(10, 0, { victories: beat(T2) });
    expect(preDuelScene(s, 'pegasus', 'regular')).toBe(DIALOGUE.duelists.pegasus.bossEntrance);
    expect(postDuelScene(s, 'pegasus', 'win', 'regular')).toBe(DIALOGUE.duelists.pegasus.bossDefeat);
    const after = { ...s, defeatedBosses: [2] };
    expect(preDuelScene(after, 'pegasus', 'regular')).not.toBe(DIALOGUE.duelists.pegasus.bossEntrance);
  });

  it('toda fala do Tier 2 resolve {nome} e o tratamento, nos três tratamentos', () => {
    for (const d of TIERS[1].duelists) {
      const dl = DIALOGUE.duelists[d.key];
      const scenes = [...(dl.firstGreeting ?? []), ...dl.greeting, ...dl.beforeDuel, ...dl.playerWins, ...dl.playerLoses,
        dl.firstWin, dl.bossEntrance ?? [], dl.bossDefeat ?? []];
      for (const line of scenes.flat()) for (const a of ['he', 'she', 'neutral'] as const) {
        expect(fillText(line.text, 'Ana', a), `${d.key}: ${line.text}`).not.toMatch(/[{}|]/);
      }
    }
  });
});
