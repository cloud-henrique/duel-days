/**
 * O estado da campanha (o save), espelhando o `CampaignState` do nativo na parte que vale para o Duel Monsters.
 * As regras ficam em funções puras nos outros arquivos de `src/campaign/`; elas recebem um estado e devolvem outro
 * (nunca mudam o que receberam).
 */
import type { Deck } from '../game/decks';
import { CAMPAIGN } from './data/types';
import { starterCards, starterDeck } from './decks';

export type Period = 0 | 1 | 2;
export const PERIOD_NAMES = ['Manhã', 'Tarde', 'Noite'] as const;
export type PeriodKey = 'morning' | 'afternoon' | 'evening';
export const PERIOD_KEYS: readonly PeriodKey[] = ['morning', 'afternoon', 'evening'];

export type Route = 'friendship' | 'romance';
export type DuelKind = 'regular' | 'bondEvent';

export interface CampaignState {
  version: typeof CAMPAIGN_VERSION;
  seed: number;
  day: number;
  period: Period;
  dp: number;
  /** Cartas possuídas: passcode → cópias. */
  collection: Record<string, number>;
  decks: Deck[];
  activeDeck: string;
  /** Vitórias contra cada duelista. */
  victories: Record<string, number>;
  /** Números dos tiers cujo chefe já foi vencido. */
  defeatedBosses: number[];
  /** Tier → dia em que o chefe dele foi vencido pela primeira vez (change `campanha-tiers`; saves antigos não têm). */
  bossDefeatedOn?: Record<number, number>;
  /** Pacotes ganhos ainda fechados (chaves), abertos na loja. */
  unopenedPacks: string[];
  packsOpened: number;
  /** Cartas na ordem em que entraram na coleção (para ordenar por "Obtenção"; saves antigos não têm). */
  acquired?: number[];
  wins: number;
  losses: number;
  totalDPEarned: number;
  concluded: boolean;
  affinity: Record<string, number>;
  bondEventsDone: Record<string, number>;
  bondRoutes: Record<string, Route>;
  /** Escolha dentro de cada evento: duelista → evento → índice da opção (change lacos-ate-o-fim). */
  bondPicks?: Record<string, Record<number, number>>;
  /** Eventos já vencidos com cada duelista quando o save ganhou as escolhas: esses não pedem escolha depois. */
  bondPicksFrom?: Record<string, number>;
  lastConversationDay: Record<string, number>;
  lastBondEventLossDay: Record<string, number>;
  /** Duelistas já encontrados (para a tela de Laços). */
  met: string[];
  /**
   * Campeão da Batalha da Cidade (change tier4-finais): o dia da primeira vitória sobre o duelo final e a cena de campeão
   * que tocou (a chave do amigo ou `generic`), para rever a mesma. Sem o campo: ainda não é campeão.
   */
  champion?: { day: number; scene: string };
  /** Duelo começado e ainda sem resultado: o app fechou no meio dele (não gasta o período). */
  pendingDuel: { duelist: string; kind: DuelKind } | null;
}

export const STARTER_DECK_ID = 'deck1';
/** Versão do save da campanha. 2: Speed Duel (change speed-duel); uma campanha de outra versão é descartada. */
export const CAMPAIGN_VERSION = 2;

export function newCampaign(seed: number): CampaignState {
  const starter = starterDeck();
  const collection: Record<string, number> = {};
  for (const id of starterCards()) collection[id] = (collection[id] ?? 0) + 1;
  return {
    version: CAMPAIGN_VERSION, seed: seed >>> 0, day: 1, period: 0, dp: 0,
    collection,
    acquired: [...new Set(starterCards())],
    decks: [{ id: STARTER_DECK_ID, name: CAMPAIGN.starterDeck.name, main: starter.main, extra: [] }],
    activeDeck: STARTER_DECK_ID,
    victories: {}, defeatedBosses: [], bossDefeatedOn: {}, unopenedPacks: [...CAMPAIGN.startingPacks], packsOpened: 0,
    wins: 0, losses: 0, totalDPEarned: 0, concluded: false,
    affinity: {}, bondEventsDone: {}, bondRoutes: {}, bondPicks: {}, bondPicksFrom: {}, lastConversationDay: {}, lastBondEventLossDay: {}, met: [],
    pendingDuel: null,
  };
}

/** Cópia funda para as regras mudarem à vontade sem tocar no estado recebido. */
export const clone = (s: CampaignState): CampaignState => structuredClone(s);

export const copies = (s: CampaignState, id: number) => s.collection[String(id)] ?? 0;

/** Põe cartas na coleção (muda `s`; use num clone). */
/** Põe cartas na coleção (muda `s`). A primeira cópia de cada uma entra no fim de `acquired`. */
export function addCards(s: CampaignState, ids: number[]) {
  for (const id of ids) {
    if (!s.collection[String(id)]) (s.acquired ??= []).push(id);
    s.collection[String(id)] = (s.collection[String(id)] ?? 0) + 1;
  }
}

export function earnDP(s: CampaignState, amount: number) {
  s.dp += amount;
  s.totalDPEarned += amount;
}

export const activeDeckOf = (s: CampaignState): Deck => s.decks.find((d) => d.id === s.activeDeck) ?? s.decks[0];
