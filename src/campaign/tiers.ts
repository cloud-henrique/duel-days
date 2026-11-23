/**
 * Os tiers (changes `campanha-tiers` e `tier-pelo-chefe`): o Tier 1 abre no dia 1; o Tier n+1 abre só depois de cada
 * duelista do Tier n (os comuns e o chefe) vencido ao menos uma vez, e só se tiver duelistas. O dia não abre tier: a
 * janela só decide o pacote-prêmio. O tier atual é o maior aberto. Nada disso fica no save além das vitórias, dos chefes
 * vencidos e do dia em que cada chefe caiu (`bossDefeatedOn`, opcional).
 */
import { TIERS, tierByNumber, tierOfDuelist, type DuelistData, type TierData } from './data/types';
import type { CampaignState } from './state';

export const FIRST_TIER = TIERS[0];
export const hasContent = (t: TierData | undefined) => !!t && t.duelists.length > 0;
export const regularsOf = (t: TierData): DuelistData[] => t.duelists.filter((d) => !d.isBoss);
export const bossOf = (t: TierData): DuelistData | undefined => t.duelists.find((d) => d.isBoss);
export const bossBeaten = (s: CampaignState, t: TierData) => s.defeatedBosses.includes(t.number);

/** Cada duelista do tier (comuns e chefe) vencido ao menos uma vez, e o chefe registrado como vencido. */
export const tierCleared = (s: CampaignState, t: TierData) =>
  hasContent(t) && bossBeaten(s, t) && t.duelists.every((d) => (s.victories[d.key] ?? 0) > 0);

/** O tier está aberto: o primeiro, ou o anterior aberto e vencido por inteiro (`tierCleared`). */
export function isTierOpen(s: CampaignState, n: number): boolean {
  const t = tierByNumber(n);
  if (!t || !hasContent(t)) return false;
  if (t === FIRST_TIER) return true;
  const prev = tierByNumber(n - 1);
  return !!prev && isTierOpen(s, n - 1) && tierCleared(s, prev);
}

/**
 * O dia em que o tier abriu (conta para as coleções dele): o dia em que o chefe anterior caiu. Save antigo sem
 * `bossDefeatedOn`: o primeiro dia da janela. Fechado: null.
 */
export function tierOpenDay(s: CampaignState, n: number): number | null {
  if (!isTierOpen(s, n)) return null;
  const t = tierByNumber(n)!;
  if (t === FIRST_TIER) return t.firstDay;
  return s.bossDefeatedOn?.[n - 1] ?? t.firstDay;
}

/** O tier atual: o maior aberto. */
export function currentTier(s: CampaignState): TierData {
  let cur = FIRST_TIER;
  for (const t of TIERS) if (isTierOpen(s, t.number)) cur = t;
  return cur;
}

/** Os tiers abertos, em ordem. */
export const openTiers = (s: CampaignState) => TIERS.filter((t) => isTierOpen(s, t.number));

/** O tier seguinte ao atual, se existir nos dados (com ou sem conteúdo). */
export const nextTier = (s: CampaignState): TierData | undefined => tierByNumber(currentTier(s).number + 1);

/** O tier do duelista (o Tier 1 para quem não está em nenhum). */
export const tierOf = (key: string): TierData => tierOfDuelist(key) ?? FIRST_TIER;
