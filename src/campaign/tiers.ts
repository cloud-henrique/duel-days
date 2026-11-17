/**
 * Os tiers no calendário (change `campanha-tiers`): o Tier 1 abre no dia 1; o Tier n+1 abre quando o chefe do Tier n é
 * vencido pela primeira vez ou no primeiro dia da janela dele, o que vier antes, e só se tiver duelistas. O tier atual é
 * o maior aberto. Nada disso fica no save além do dia em que cada chefe caiu (`bossDefeatedOn`, opcional).
 */
import { TIERS, tierByNumber, tierOfDuelist, type DuelistData, type TierData } from './data/types';
import type { CampaignState } from './state';

export const FIRST_TIER = TIERS[0];
export const hasContent = (t: TierData | undefined) => !!t && t.duelists.length > 0;
export const regularsOf = (t: TierData): DuelistData[] => t.duelists.filter((d) => !d.isBoss);
export const bossOf = (t: TierData): DuelistData | undefined => t.duelists.find((d) => d.isBoss);
export const bossBeaten = (s: CampaignState, t: TierData) => s.defeatedBosses.includes(t.number);

/** O tier está aberto: o anterior aberto e (o chefe dele vencido ou chegou o primeiro dia da janela). */
export function isTierOpen(s: CampaignState, n: number): boolean {
  const t = tierByNumber(n);
  if (!t || !hasContent(t)) return false;
  if (t === FIRST_TIER) return true;
  return isTierOpen(s, n - 1) && (s.defeatedBosses.includes(n - 1) || s.day >= t.firstDay);
}

/**
 * O dia em que o tier abriu (conta para as coleções dele): o dia do chefe anterior vencido, se veio antes da janela;
 * senão o primeiro dia da janela. Save antigo sem `bossDefeatedOn`: o primeiro dia da janela. Fechado: null.
 */
export function tierOpenDay(s: CampaignState, n: number): number | null {
  if (!isTierOpen(s, n)) return null;
  const t = tierByNumber(n)!;
  if (t === FIRST_TIER) return t.firstDay;
  return Math.min(t.firstDay, s.bossDefeatedOn?.[n - 1] ?? t.firstDay);
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
