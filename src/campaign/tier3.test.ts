// Cenários dos specs da change `tier3-batalha-da-cidade` (elenco-tier3, progressao-por-tiers, economia-dp, campanha).
import { describe, expect, it } from 'vitest';
import { awaitsNextUpdate } from './calendar';
import { debugPreset } from './debug';
import { isPresent, placements, present, tierProgress } from './map';
import { collectionListing } from './packs';
import { applyDuel, duelDP } from './rewards';
import { newCampaign, type CampaignState, type Period } from './state';
import { currentTier, tierOpenDay } from './tiers';
import { DIALOGUE, TIERS } from './data/types';
import { postDuelScene, preDuelScene } from './encounter';
import { fillText } from './text';

const at = (day: number, period: Period = 0, extra: Partial<CampaignState> = {}, seed = 42): CampaignState =>
  ({ ...newCampaign(seed), day, period, ...extra });
const T1 = ['tristan', 'tea', 'joey', 'bakura'];
const T2 = ['weevil', 'rex', 'mako', 'keith', 'mai'];
const T3 = ['espa', 'rarehunter', 'arkana', 'strings'];
const beat = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, 1]));
const win = { result: 'win' as const, turns: 12, lifePoints: 3000 };
const listing = (s: CampaignState) => Object.fromEntries(collectionListing(s).map((e) => [e.pack.key, e.lock]));
/** Tudo vencido até o Tier 2 (Yugi e Pegasus no mapa), Tier 3 aberto pelo Pegasus no dia 12. */
const allBosses = (day: number, period: Period = 0, seed = 42) => at(day, period, {
  victories: beat([...T1, 'yugi', ...T2, 'pegasus', ...T3]), defeatedBosses: [1, 2], bossDefeatedOn: { 1: 5, 2: 12 },
}, seed);

describe('elenco do Tier 3', () => {
  it('4 comuns e o Kaiba de chefe, sem laço, com cena, falas e assinatura', () => {
    const t3 = TIERS[2];
    expect(t3).toMatchObject({ number: 3, name: 'Batalha da Cidade', firstDay: 15, lastDay: 22 });
    expect(t3.duelists.filter((d) => !d.isBoss).map((d) => d.key)).toEqual(T3);
    expect(t3.duelists.find((d) => d.isBoss)?.key).toBe('kaiba');
    expect(t3.packs.map((p) => [p.key, p.offset])).toEqual([['mfc', 0], ['dcr', 2], ['ioc', 4]]);
    for (const d of t3.duelists) {
      expect(d.bond, d.key).toBe(false);
      expect(d.scene.bg && d.scene.place, d.key).toBeTruthy();
      expect(DIALOGUE.duelists[d.key]?.greeting.length, d.key).toBeGreaterThan(0);
      expect(d.deck.main.some((e) => e.id === d.signatureCard.id), `${d.key}: assinatura no deck`).toBe(true);
    }
  });

  it('antes do Tier 3 (dia 12, sem o Pegasus), nenhum duelista do T3', () => {
    for (const p of [0, 1, 2] as Period[]) expect(present(at(12, p)).some((d) => T3.includes(d.key))).toBe(false);
  });

  it('Tier 3 pelo prazo: manhã do dia 15, 2 a 4 do T3 e o Pegasus disponível quando liberado', () => {
    const s = at(15, 0, { victories: beat(T2) });
    expect(currentTier(s).number).toBe(3);
    expect(tierOpenDay(s, 3)).toBe(15);
    const t3 = present(s).filter((d) => T3.includes(d.key)).length;
    expect(t3).toBeGreaterThanOrEqual(2); expect(t3).toBeLessThanOrEqual(4);
    expect(isPresent(s, 'pegasus')).toBe(true);
  });

  it('o Kaiba aparece depois dos 4 comuns do T3 vencidos', () => {
    expect(isPresent(at(16, 0, { victories: beat(T3.slice(0, 3)) }), 'kaiba')).toBe(false);
    const all = at(16, 0, { victories: beat(T3) });
    expect(isPresent(all, 'kaiba')).toBe(true);
    expect(tierProgress(all)).toMatchObject({ number: 3, name: 'Batalha da Cidade', beaten: 4, total: 4, boss: 'Kaiba está esperando!' });
  });

  it('assinatura do Strings: 5ª vitória dá o Slime Renascido; vitória no T3 paga a base de 500', () => {
    const r = applyDuel(at(16, 0, { victories: { strings: 4 } }), 'strings', 'regular', win);
    expect(r.reward.cards.find((c) => c.kind === 'signature')?.id).toBe(31709826);
    expect(r.reward.baseDP).toBe(500);
    expect(duelDP({ result: 'win', turns: 12, lifePoints: 5000 }, 3).total).toBeGreaterThan(480);
  });
});

describe('progressão depois do Tier 3', () => {
  it('Kaiba vencido no dia 20 sem Tier 4: prêmio, o tier continua o 3 e o progresso avisa', () => {
    const s = at(20, 0, { victories: beat(T3), defeatedBosses: [1, 2] });
    const r = applyDuel(s, 'kaiba', 'regular', win);
    expect(r.reward.prizePack).not.toBeNull();
    expect(r.state.defeatedBosses).toContain(3);
    expect(currentTier(r.state).number).toBe(3);
    expect(awaitsNextUpdate(r.state)).toBe(true);
  });

  it('prazo do Tier 3 sem Tier 4: do dia 23 ao 30, o tier continua o 3', () => {
    for (const day of [23, 26, 30]) expect(currentTier(at(day)).number).toBe(3);
    expect(awaitsNextUpdate(at(23))).toBe(true);
    expect(awaitsNextUpdate(at(20))).toBe(false);
  });

  it('save parado no Tier 2 (dia 17): abre no Tier 3, desde o dia 15 ou desde o Pegasus', () => {
    const old = at(17);
    delete (old as Partial<CampaignState>).bossDefeatedOn;
    expect(currentTier(old).number).toBe(3);
    expect(tierOpenDay(old, 3)).toBe(15);
    const pg = at(17, 0, { defeatedBosses: [2], bossDefeatedOn: { 2: 12 } });
    expect(tierOpenDay(pg, 3)).toBe(12);
    expect(listing(pg).ioc).toBeNull(); // dia 12 + 4
  });

  it('entrada e derrota do Kaiba só até a primeira vitória', () => {
    const s = at(18, 0, { victories: beat(T3) });
    expect(preDuelScene(s, 'kaiba', 'regular')).toBe(DIALOGUE.duelists.kaiba.bossEntrance);
    expect(postDuelScene(s, 'kaiba', 'win', 'regular')).toBe(DIALOGUE.duelists.kaiba.bossDefeat);
    expect(preDuelScene({ ...s, defeatedBosses: [3] }, 'kaiba', 'regular')).not.toBe(DIALOGUE.duelists.kaiba.bossEntrance);
  });
});

describe('loja do Tier 3', () => {
  it('Tier 3 na vitrine: no dia 10, MFC, DCR e IOC bloqueados com "Tier 3 · dia 15"', () => {
    const l = listing(at(10));
    for (const k of ['mfc', 'dcr', 'ioc']) expect(l[k], k).toEqual({ kind: 'tier', tier: 3, day: 15 });
  });

  it('Tier 3 pelo prazo, dia 16: MFC à venda, DCR no dia 17, IOC no 19, e as 7 antigas à venda', () => {
    const l = listing(at(16));
    expect(l.mfc).toBeNull();
    expect(l.dcr).toEqual({ kind: 'day', day: 17 });
    expect(l.ioc).toEqual({ kind: 'day', day: 19 });
    for (const k of ['lob', 'mrd', 'mrl', 'psv', 'lon', 'lod', 'pgd']) expect(l[k], k).toBeNull();
  });
});

describe('mapa cheio no Tier 3', () => {
  it('16 cabeças (4 do T3, os comuns do T1 e do T2, 3 chefes) sem encostar, cada tier no seu anel', () => {
    let full = 0, minGap = Infinity;
    for (let seed = 1; seed <= 40; seed++) for (let day = 15; day <= 22; day++) for (const p of [0, 1, 2] as Period[]) {
      const s = allBosses(day, p, seed);
      const pl = placements(s);
      if (pl.filter((x) => T3.includes(x.duelist.key)).length < 4) continue;
      full++;
      expect(pl).toHaveLength(16);
      const dist = (keys: string[]) => pl.filter((x) => keys.includes(x.duelist.key)).map((x) => Math.abs(x.point.x - 0.5));
      expect(Math.max(...dist(T3))).toBeLessThan(Math.min(...dist(T2)));
      expect(Math.max(...dist(T2))).toBeLessThan(Math.min(...dist(T1)));
      for (const a of pl) for (const b of pl) if (a !== b) minGap = Math.min(minGap, Math.hypot((a.point.x - b.point.x) * 2, a.point.y - b.point.y));
    }
    expect(full).toBeGreaterThan(20);
    expect(minGap).toBeGreaterThan(0.14); // a cabeça tem ~0,1 da altura do panorama (MIN_GAP é 0,17, o ideal)
  });
});

describe('falas e presets do Tier 3', () => {
  it('toda fala do Tier 3 resolve {nome} e o tratamento, e o Strings só usa as expressões que tem', () => {
    for (const d of TIERS[2].duelists) {
      const dl = DIALOGUE.duelists[d.key];
      const scenes = [...(dl.firstGreeting ?? []), ...dl.greeting, ...dl.beforeDuel, ...dl.playerWins, ...dl.playerLoses,
        dl.firstWin, dl.bossEntrance ?? [], dl.bossDefeat ?? []];
      expect(dl.greeting.length, d.key).toBeGreaterThanOrEqual(2);
      for (const line of scenes.flat()) {
        for (const a of ['he', 'she', 'neutral'] as const) expect(fillText(line.text, 'Ana', a), `${d.key}: ${line.text}`).not.toMatch(/[{}|]/);
        if (line.speaker === 'strings') expect(['neutral', 'sad']).toContain(line.expression);
      }
    }
  });

  it('tier3 e kaiba: Tier 3 aberto; no kaiba, o chefe no mapa', () => {
    const t3 = debugPreset('tier3', newCampaign(7))!;
    expect(currentTier(t3).number).toBe(3);
    const kb = debugPreset('kaiba', newCampaign(7))!;
    expect(currentTier(kb).number).toBe(3);
    expect(present(kb).some((d) => d.key === 'kaiba')).toBe(true);
  });
});
