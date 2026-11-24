/** O resultado de um duelo da campanha: DP com bônus, cartas, laço, chefe e o período (`Campaign+Duels` do nativo). */
import { BALANCE, LIMITED, MAX_COPIES } from './balance';
import { addAffinity, championScene, eventTitle, hasStory, openBondEvent } from './bond';
import { advancePeriod } from './calendar';
import { duelistByKey, type DuelistData, type Scene } from './data/types';
import { duelistDeck } from './decks';
import { postDuelScene, type DuelResult } from './encounter';
import { seedPosition } from './map';
import { characterPacks, collectionPacks } from './packs';
import { PURPOSE, generator, pick, type Rng } from './rng';
import { addCards, clone, copies, earnDP, type CampaignState, type DuelKind } from './state';
import { tierOf } from './tiers';

export interface DuelOutcome { result: DuelResult; turns: number; lifePoints: number; startingLifePoints?: number }

export type BonusKind = 'healthyFinish' | 'quickWin' | 'flawless';
export const BONUS_NAMES: Record<BonusKind, string> = { healthyFinish: 'Vida sobrando', quickWin: 'Vitória rápida', flawless: 'Sem arranhão' };

export interface EarnedCard { id: number; isNew: boolean; kind: 'drop' | 'signature' | 'bondGift' }
export interface BondProgress {
  before: number; after: number;
  openedEvent: number | null; completedEvent: number | null; pendingEvent: number | null;
  openedTitle: string | null; completedTitle: string | null; pendingTitle: string | null;
}
export interface DuelReward {
  opponentName: string;
  won: boolean;
  baseDP: number;
  bonuses: { kind: BonusKind; dp: number }[];
  totalDP: number;
  newBalance: number;
  defeatedBossForFirstTime: boolean;
  prizePack: string | null;
  unlockedPack: string | null;
  cards: EarnedCard[];
  bond: BondProgress | null;
  concluded: boolean;
  /** Primeira vitória sobre o duelo final: a cena de campeão que toca agora (chave do amigo ou `generic`). */
  champion: string | null;
}

/** A base da vitória pelo tier do oponente. */
export const baseDPFor = (tier: number) => BALANCE.baseDPByTier[tier] ?? BALANCE.baseDPByTier[1];

/**
 * DP do duelo: na vitória, a base do tier do oponente e os bônus (com teto); senão, a consolação (sobre a base do
 * Tier 1, a mesma para todos).
 */
export function duelDP(o: DuelOutcome, tier = 1): { base: number; bonuses: { kind: BonusKind; dp: number }[]; total: number } {
  const base = baseDPFor(tier);
  if (o.result !== 'win') { const total = Math.floor((baseDPFor(1) * BALANCE.consolationRate) / 100); return { base: total, bonuses: [], total }; }
  const start = o.startingLifePoints ?? BALANCE.startingLifePoints;
  const earned: [BonusKind, number][] = [];
  if (o.lifePoints * 100 >= start * BALANCE.healthyFinishThreshold) earned.push(['healthyFinish', BALANCE.healthyFinishBonus]);
  if (o.turns <= BALANCE.quickWinMaxTurns) earned.push(['quickWin', BALANCE.quickWinBonus]);
  if (o.lifePoints >= start) earned.push(['flawless', BALANCE.flawlessBonus]);
  let budget = BALANCE.maxBonus;
  const bonuses: { kind: BonusKind; dp: number }[] = [];
  for (const [kind, pct] of earned) {
    const p = Math.min(pct, budget);
    budget -= p;
    if (p > 0) bonuses.push({ kind, dp: Math.floor((base * p) / 100) });
  }
  return { base, bonuses, total: base + bonuses.reduce((n, b) => n + b.dp, 0) };
}

/** Uma carta das cópias do deck do oponente, sem as limitadas; prefere as que o jogador não tem em 3 cópias. */
export function drawCard(deck: number[], owned: Record<string, number>, g: Rng): number | undefined {
  const tickets = deck.filter((id) => !LIMITED.has(id));
  const missing = tickets.filter((id) => (owned[String(id)] ?? 0) < MAX_COPIES);
  return pick(g, missing.length ? missing : tickets);
}

function earn(s: CampaignState, id: number, kind: EarnedCard['kind']): EarnedCard {
  const card = { id, isNew: copies(s, id) === 0, kind };
  addCards(s, [id]);
  return card;
}

const duelistData = (key: string): DuelistData => {
  const d = duelistByKey(key);
  if (!d) throw new Error(`duelista desconhecido: ${key}`);
  return d;
};

/**
 * Aplica o resultado de um duelo: DP, cartas, vitórias, chefe, laço e o período. Devolve também a fala de depois,
 * calculada com o estado de antes (a primeira vitória é a de 0 vitórias antes do duelo).
 */
/** A assinatura saía na 10ª vitória (antes de passar para a 5ª). */
const LEGACY_SIGNATURE_WINS = 10;

export function applyDuel(s0: CampaignState, key: string, kind: DuelKind, o: DuelOutcome):
  { state: CampaignState; reward: DuelReward; after: Scene } {
  if (s0.concluded) throw new Error('campanha terminada');
  const d = duelistData(key);
  const after = postDuelScene(s0, key, o.result, kind);
  const s = clone(s0);
  const openBefore = openBondEvent(s, key);
  if (kind === 'bondEvent' && openBefore === null) throw new Error(`sem evento aberto com ${key}`);
  const won = o.result === 'win';
  const tier = tierOf(key);
  const dp = duelDP(o, tier.number);
  earnDP(s, dp.total);

  const cards: EarnedCard[] = [];
  let unlocked: string | null = null, prize: string | null = null, firstBoss = false, champion: string | null = null;
  if (won) {
    const nth = (s.victories[key] ?? 0) + 1;
    // A assinatura sai na 5ª vitória (o duelo final a entrega na 1ª). Saves de quando era na 10ª (entre a 5ª e a 10ª, sem
    // a carta) a ganham na próxima.
    const lateSignature = !d.isFinal && nth > BALANCE.signatureWins && nth <= LEGACY_SIGNATURE_WINS && copies(s, d.signatureCard.id) === 0;
    if (nth === (d.isFinal ? 1 : BALANCE.signatureWins) || lateSignature) cards.push(earn(s, d.signatureCard.id, 'signature'));
    const deck = duelistDeck(key);
    const g = generator(PURPOSE.cardDrop, s.seed, s.day, s.period, seedPosition(key));
    const drop = drawCard([...deck.main, ...deck.extra], s.collection, g);
    if (drop !== undefined) cards.push(earn(s, drop, 'drop'));
    s.wins += 1;
    const before = new Set(characterPacks(s).map((p) => p.key));
    s.victories[key] = nth;
    unlocked = characterPacks(s).find((p) => !before.has(p.key))?.key ?? null;
    // Primeira vitória sobre o chefe: abre o próximo tier (pelo `defeatedBosses`) e, dentro da janela do tier do
    // chefe, dá um pacote da coleção mais recente à venda.
    if (d.isBoss && !s.defeatedBosses.includes(tier.number)) {
      firstBoss = true;
      const newest = collectionPacks(s).at(-1);
      if (s.day <= tier.lastDay && newest) { prize = newest.key; s.unopenedPacks.push(newest.key); }
      s.defeatedBosses.push(tier.number);
      s.bossDefeatedOn = { ...s.bossDefeatedOn, [tier.number]: s.day };
    }
    // Primeira vitória sobre o duelo final: o título de campeão e a cena que toca (gravada para rever a mesma).
    if (d.isFinal && !s.champion) { champion = championScene(s); s.champion = { day: s.day, scene: champion }; }
  } else {
    s.losses += 1;
  }

  let bond: BondProgress | null = null;
  if (hasStory(d)) {
    const affBefore = s.affinity[key] ?? 0;
    let completed: number | null = null;
    if (kind === 'bondEvent' && openBefore !== null) {
      if (won) {
        completed = openBefore;
        s.bondEventsDone[key] = openBefore;
        if (openBefore === BALANCE.bondGiftEvent && d.bondGift) cards.push(earn(s, d.bondGift.id, 'bondGift'));
      } else {
        s.lastBondEventLossDay[key] = s.day;
      }
    } else {
      const pts = o.result === 'win' ? BALANCE.bondWinPoints : o.result === 'forfeit' ? 0 : BALANCE.bondLossPoints;
      addAffinity(s, key, pts);
    }
    const now = openBondEvent(s, key);
    const opened = now !== openBefore ? now : null;
    const pending = completed === null ? openBefore : null;
    const title = (n: number | null) => (n === null ? null : eventTitle(key, n));
    bond = {
      before: affBefore, after: s.affinity[key] ?? 0,
      openedEvent: opened, completedEvent: completed, pendingEvent: pending,
      openedTitle: title(opened), completedTitle: title(completed), pendingTitle: title(pending),
    };
  }

  s.pendingDuel = null;
  advancePeriod(s);
  return {
    state: s, after,
    reward: {
      opponentName: d.name, won, baseDP: dp.base, bonuses: dp.bonuses, totalDP: dp.total, newBalance: s.dp,
      defeatedBossForFirstTime: firstBoss, prizePack: prize, unlockedPack: unlocked, cards, bond, concluded: s.concluded, champion,
    },
  };
}
