/** O mapa: quem aparece em cada período e quando o chefe chega. */
import { BALANCE } from './balance';
import { CAMPAIGN, type DuelistData, type LocationData } from './data/types';
import { PURPOSE, generator, randInt, shuffle } from './rng';
import type { CampaignState } from './state';

const TIER = CAMPAIGN.tier;
export const LOCATIONS: readonly LocationData[] = TIER.locations;
export const REGULARS: readonly DuelistData[] = TIER.duelists.filter((d) => !d.isBoss);
export const BOSS: DuelistData | undefined = TIER.duelists.find((d) => d.isBoss);
/** Posição do duelista na lista do tier: entra nos sorteios por duelista. */
export const seedPosition = (key: string) => TIER.duelists.findIndex((d) => d.key === key);

export const locationOf = (key: string) => LOCATIONS.find((l) => l.key === key);
export const shopLocation = () => LOCATIONS.find((l) => l.isShop);

export const beatenRegulars = (s: CampaignState) => REGULARS.filter((d) => (s.victories[d.key] ?? 0) > 0);
export const isBossAvailable = (s: CampaignState) => beatenRegulars(s).length === REGULARS.length;

/**
 * Os duelistas no mapa agora: de 2 a 4 comuns sorteados pela semente, pelo dia e pelo período (na ordem do elenco,
 * para a lista não "pular"), mais o chefe quando liberado. Campanha terminada: ninguém.
 */
export function present(s: CampaignState): DuelistData[] {
  if (s.concluded) return [];
  const g = generator(PURPOSE.opponents, s.seed, s.day, s.period);
  const span = BALANCE.opponentsMax - BALANCE.opponentsMin + 1;
  const count = Math.min(REGULARS.length, BALANCE.opponentsMin + randInt(g, span));
  const drawn = new Set(shuffle(REGULARS, g).slice(0, count).map((d) => d.key));
  const regulars = REGULARS.filter((d) => drawn.has(d.key));
  return BOSS && isBossAvailable(s) ? [...regulars, BOSS] : regulars;
}

export const isPresent = (s: CampaignState, key: string) => present(s).some((d) => d.key === key);

/** Quem está num lugar agora. */
export const presentAt = (s: CampaignState, location: string) => present(s).filter((d) => d.location === location);

/** A linha do progresso do tier no cabeçalho. */
export function tierProgress(s: CampaignState) {
  const beaten = beatenRegulars(s).length;
  const bossName = BOSS?.name ?? 'o chefe';
  const boss = BOSS && s.defeatedBosses.includes(TIER.number) ? `${bossName} vencido`
    : isBossAvailable(s) ? `${bossName} está esperando!`
    : `vença todos para desafiar ${bossName}`;
  return { name: TIER.name, number: TIER.number, beaten, total: REGULARS.length, boss };
}
