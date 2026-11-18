// Metas de vitória do duelista contra o deck inicial (spec `cpu-do-duelo`).
import { tierOfDuelist } from '../src/campaign/data/types';
import { cpuFor } from '../src/campaign/decks';

export const TARGETS = { 1: 0.55, 2: 0.7, boss: 0.85 } as const;
export const targetFor = (key: string) =>
  cpuFor(key) === 'chefe' ? TARGETS.boss : TARGETS[(tierOfDuelist(key)?.number ?? 1) as 1 | 2] ?? TARGETS[2];
