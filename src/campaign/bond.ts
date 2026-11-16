/** Laços: afinidade em corações, conversa, eventos de laço, rota amizade/romance e epílogo (`Campaign+Bond` do nativo). */
import { BALANCE } from './balance';
import { CAMPAIGN, DIALOGUE, type BondEvent, type DuelistData, type Scene } from './data/types';
import { isPresent, seedPosition } from './map';
import { PURPOSE, generator, pick } from './rng';
import { clone, type CampaignState, type Route } from './state';

export type Topic = 'duels' | 'school' | 'hobbies' | 'rumors';
export const TOPICS: readonly Topic[] = ['duels', 'school', 'hobbies', 'rumors'];
export const TOPIC_NAMES: Record<Topic, string> = { duels: 'Duelos', school: 'Escola', hobbies: 'Hobbies', rumors: 'Boatos' };
const RISKY: readonly Topic[] = ['duels', 'school', 'hobbies'];
export const ROUTE_NAMES: Record<Route, string> = { friendship: 'Amizade', romance: 'Romance' };

const MAX = BALANCE.pointsPerHeart * BALANCE.bondEvents;

/** Duelista com história: os que têm carta do laço (todos os 5 do Tier 1). */
export const hasStory = (d: DuelistData | undefined) => !!d?.bondGift;
export const storyDuelists = () => CAMPAIGN.tier.duelists.filter(hasStory);
const find = (key: string) => CAMPAIGN.tier.duelists.find((d) => d.key === key);

export const affinityOf = (s: CampaignState, key: string) => s.affinity[key] ?? 0;
export const eventsDone = (s: CampaignState, key: string) => s.bondEventsDone[key] ?? 0;
export const hearts = (s: CampaignState, key: string) => affinityOf(s, key) / BALANCE.pointsPerHeart;

export const isChoicePending = (s: CampaignState, key: string) =>
  eventsDone(s, key) >= BALANCE.bondChoiceEvent && !s.bondRoutes[key];

/** O número (1–4) do evento aberto, ou null. */
export function openBondEvent(s: CampaignState, key: string): number | null {
  if (!hasStory(find(key))) return null;
  const done = eventsDone(s, key);
  if (done >= BALANCE.bondEvents || isChoicePending(s, key)) return null;
  if (affinityOf(s, key) < (done + 1) * BALANCE.pointsPerHeart) return null;
  if (done === 0 && (s.victories[key] ?? 0) === 0) return null;
  return done + 1;
}

/** O evento aberto que ainda dá para jogar hoje (some até amanhã depois de perder o duelo do evento). */
export const eventRestingToday = (s: CampaignState, key: string) =>
  openBondEvent(s, key) !== null && s.lastBondEventLossDay[key] === s.day;
export const playableEvent = (s: CampaignState, key: string) => (eventRestingToday(s, key) ? null : openBondEvent(s, key));
/** O "!" no mapa: evento jogável hoje ou escolha pendente. */
export const needsAttention = (s: CampaignState, key: string) => playableEvent(s, key) !== null || isChoicePending(s, key);

/** Soma afinidade com teto (fim do coração do próximo evento) e piso (começo do coração atual). Muda `s`. */
export function addAffinity(s: CampaignState, key: string, points: number): { before: number; after: number } {
  const before = affinityOf(s, key);
  const cap = Math.min((eventsDone(s, key) + 1) * BALANCE.pointsPerHeart, MAX);
  const floor = Math.min(Math.floor(before / BALANCE.pointsPerHeart) * BALANCE.pointsPerHeart, cap);
  const after = Math.max(floor, Math.min(cap, before + points));
  s.affinity[key] = after;
  return { before, after };
}

/** O tema ruim do dia com o duelista (um entre Duelos, Escola e Hobbies; Boatos nunca). */
export const dislikedTopic = (s: CampaignState, key: string): Topic =>
  pick(generator(PURPOSE.conversation, s.seed, s.day, seedPosition(key)), RISKY) ?? 'duels';

export const talkedToday = (s: CampaignState, key: string) => s.lastConversationDay[key] === s.day;
export const canTalk = (s: CampaignState, key: string) =>
  !s.concluded && hasStory(find(key)) && isPresent(s, key) && !talkedToday(s, key);

export interface ConversationResult { topic: Topic; liked: boolean; before: number; after: number; openedEvent: number | null }

export function talk(s0: CampaignState, key: string, topic: Topic): { state: CampaignState; result: ConversationResult } {
  if (!canTalk(s0, key)) throw new Error(`não dá para conversar com ${key} agora`);
  const s = clone(s0);
  const liked = topic !== dislikedTopic(s, key);
  const points = topic === 'rumors' ? BALANCE.conversationRumorsPoints
    : liked ? BALANCE.conversationLikedPoints : BALANCE.conversationDislikedPoints;
  const eventBefore = openBondEvent(s, key);
  const { before, after } = addAffinity(s, key, points);
  s.lastConversationDay[key] = s.day;
  const eventAfter = openBondEvent(s, key);
  return { state: s, result: { topic, liked, before, after, openedEvent: eventAfter !== eventBefore ? eventAfter : null } };
}

export function conversationScene(key: string, result: ConversationResult): Scene {
  const t = DIALOGUE.duelists[key].conversation[result.topic];
  return result.liked ? t.liked : t.disliked ?? t.liked;
}

// --- Eventos ---

export const bondEvent = (key: string, n: number): BondEvent | undefined => DIALOGUE.duelists[key]?.bondEvents[n - 1];
export const eventTitle = (key: string, n: number) => bondEvent(key, n)?.title ?? '';

/** As cenas de antes e depois de um evento, pela rota (o 4º evento tem uma versão por rota). */
export function eventScenes(ev: BondEvent, route: Route | undefined): { before: Scene; after: Scene } {
  if ('friendship' in ev) return ev[route === 'romance' ? 'romance' : 'friendship'];
  return { before: ev.before, after: ev.after };
}

export const choiceOf = (ev: BondEvent | undefined) => (ev && 'choice' in ev ? ev.choice : undefined);

/** A cena que pede a escolha (o fim do 3º evento), se ela estiver pendente. */
export function bondChoiceScene(s: CampaignState, key: string): Scene | null {
  if (!isChoicePending(s, key)) return null;
  const ev = bondEvent(key, BALANCE.bondChoiceEvent);
  return ev ? eventScenes(ev, undefined).after : null;
}

/** Grava a escolha e devolve a fala que vem depois dela. */
export function chooseRoute(s0: CampaignState, key: string, route: Route): { state: CampaignState; then: Scene } {
  if (!isChoicePending(s0, key)) throw new Error(`sem escolha pendente com ${key}`);
  const s = clone(s0);
  s.bondRoutes[key] = route;
  return { state: s, then: choiceOf(bondEvent(key, BALANCE.bondChoiceEvent))?.[route].then ?? [] };
}

/** Rever um evento vencido: antes + depois (+ a continuação da escolha, no 3º). Não muda o save. */
export function eventReview(s: CampaignState, key: string, n: number): Scene | null {
  const ev = bondEvent(key, n);
  if (!ev || n > eventsDone(s, key)) return null;
  const route = s.bondRoutes[key];
  const { before, after } = eventScenes(ev, route);
  const choice = choiceOf(ev);
  return [...before, ...after, ...(route && choice ? choice[route].then : [])];
}

// --- Epílogo ---

/** Quem tem mais eventos vencidos; no empate, mais afinidade; depois, a ordem do conteúdo. Ninguém com 0 eventos. */
export function epilogueDuelist(s: CampaignState): DuelistData | null {
  let best: { d: DuelistData; ev: number; af: number } | null = null;
  for (const d of storyDuelists()) {
    const ev = eventsDone(s, d.key), af = affinityOf(s, d.key);
    if (ev <= 0) continue;
    if (!best || ev > best.ev || (ev === best.ev && af > best.af)) best = { d, ev, af };
  }
  return best?.d ?? null;
}

export function epilogue(s: CampaignState): { duelist: DuelistData; route: Route; scene: Scene } | null {
  const d = epilogueDuelist(s);
  if (!d) return null;
  const route: Route = s.bondRoutes[d.key] === 'romance' ? 'romance' : 'friendship';
  return { duelist: d, route, scene: DIALOGUE.duelists[d.key].epilogue[route] };
}
