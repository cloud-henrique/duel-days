// Só para os testes: um save com os tiers abaixo de `n` vencidos por inteiro (change `tier-pelo-chefe`).
import { TIERS } from '../data/types';
import type { CampaignState } from '../state';

/**
 * Cada duelista dos tiers abaixo de `n` vencido uma vez (mais as vitórias de `wins`), os chefes deles vencidos, cada um
 * no primeiro dia da janela do tier seguinte (`on` troca esse dia).
 */
export function openTo(n: number, wins: string[] = [], on: Record<number, number> = {}): Partial<CampaignState> {
  const done = TIERS.filter((t) => t.number < n);
  const keys = [...done.flatMap((t) => t.duelists.map((d) => d.key)), ...wins];
  return {
    victories: Object.fromEntries(keys.map((k) => [k, 1])),
    defeatedBosses: done.map((t) => t.number),
    bossDefeatedOn: Object.fromEntries(done.map((t) => [t.number, on[t.number] ?? TIERS[t.number].firstDay])),
  };
}
