// Metas de vitória do duelista contra o deck inicial (spec `cpu-do-duelo`).
import { duelistByKey, tierOfDuelist } from '../src/campaign/data/types';
import { cpuFor } from '../src/campaign/decks';

/** `final`: o duelo final (Yami Yugi, change tier4-finais), acima dos chefes. */
export const TARGETS = { 1: 0.55, 2: 0.7, 3: 0.78, 4: 0.82, boss: 0.85, final: 0.9 } as const;
export const targetFor = (key: string) =>
  duelistByKey(key)?.isFinal
    ? TARGETS.final
    : cpuFor(key) === 'chefe'
      ? TARGETS.boss
      : (TARGETS[(tierOfDuelist(key)?.number ?? 1) as 1 | 2 | 3 | 4] ?? TARGETS[4]);
