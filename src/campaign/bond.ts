/** Laços: afinidade em corações, conversa, eventos de laço, rota amizade/romance e epílogo (`Campaign+Bond` do nativo). */
import { BALANCE } from './balance';
import { DIALOGUE, DUELISTS, duelistByKey, type BondEvent, type BondPick, type DuelistData, type PickTone, type Scene } from './data/types';
import { isPresent, seedPosition } from './map';
import { PURPOSE, generator, pick } from './rng';
import { clone, type CampaignState, type Route } from './state';
import { isTierOpen } from './tiers';

export type Topic = 'duels' | 'school' | 'hobbies' | 'rumors';
export const TOPICS: readonly Topic[] = ['duels', 'school', 'hobbies', 'rumors'];
export const TOPIC_NAMES: Record<Topic, string> = { duels: 'Duelos', school: 'Escola', hobbies: 'Hobbies', rumors: 'Boatos' };
const RISKY: readonly Topic[] = ['duels', 'school', 'hobbies'];
export const ROUTE_NAMES: Record<Route, string> = { friendship: 'Amizade', romance: 'Romance' };

const MAX = BALANCE.pointsPerHeart * BALANCE.bondEvents;

/** Duelista com história: os com laço e carta do laço (os 5 do Tier 1). Os dos tiers seguintes não têm. */
export const hasStory = (d: DuelistData | undefined) => !!d?.bond && !!d.bondGift;
export const storyDuelists = () => DUELISTS.filter(hasStory);
const find = duelistByKey;

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
  // O 5º e o 6º seguem a história do Reino dos Duelistas e da Batalha da Cidade: esperam o tier abrir.
  const tier = BALANCE.bondEventTier[done + 1];
  if (tier && !isTierOpen(s, tier)) return null;
  if (done === 0 && (s.victories[key] ?? 0) === 0) return null;
  return done + 1;
}

/** O evento aberto que ainda dá para jogar hoje (some até amanhã depois de perder o duelo do evento). */
export const eventRestingToday = (s: CampaignState, key: string) =>
  openBondEvent(s, key) !== null && s.lastBondEventLossDay[key] === s.day;
export const playableEvent = (s: CampaignState, key: string) => (eventRestingToday(s, key) ? null : openBondEvent(s, key));
/** O "!" no mapa: evento jogável hoje, escolha de rota ou resposta de evento pendente. */
export const needsAttention = (s: CampaignState, key: string) =>
  playableEvent(s, key) !== null || isChoicePending(s, key) || pendingPick(s, key) !== null;

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
  const t = DIALOGUE.duelists[key].conversation?.[result.topic];
  if (!t) return [];
  return result.liked ? t.liked : t.disliked ?? t.liked;
}

// --- Eventos ---

export const bondEvent = (key: string, n: number): BondEvent | undefined => DIALOGUE.duelists[key]?.bondEvents?.[n - 1];
export const eventTitle = (key: string, n: number) => bondEvent(key, n)?.title ?? '';

/** As cenas de antes e depois de um evento, pela rota (o 4º evento tem uma versão por rota). */
export function eventScenes(ev: BondEvent, route: Route | undefined): { before: Scene; after: Scene } {
  if ('friendship' in ev) return ev[route === 'romance' ? 'romance' : 'friendship'];
  return { before: ev.before, after: ev.after };
}

export const choiceOf = (ev: BondEvent | undefined) => (ev && 'choice' in ev ? ev.choice : undefined);
export const pickOf = (ev: BondEvent | undefined): BondPick | undefined => (ev && 'pick' in ev ? ev.pick : undefined);

// --- Escolha dentro do evento (change lacos-ate-o-fim) ---

const PICK_POINTS: Record<PickTone, number> = { good: BALANCE.bondPickGood, neutral: BALANCE.bondPickNeutral, bad: BALANCE.bondPickBad };
export const pickPoints = (tone: PickTone) => PICK_POINTS[tone];
const pickedOption = (s: CampaignState, key: string, n: number) => s.bondPicks?.[key]?.[n];

/**
 * O evento vencido mais antigo com escolha e sem resposta (ou null). Só conta os vencidos depois que o save ganhou as
 * escolhas (`bondPicksFrom`); um save sem `bondPicks` não tem pendência.
 */
export function pendingPick(s: CampaignState, key: string): number | null {
  if (!s.bondPicks || !hasStory(find(key))) return null;
  for (let n = (s.bondPicksFrom?.[key] ?? 0) + 1; n <= eventsDone(s, key); n++) {
    if (pickOf(bondEvent(key, n)) && pickedOption(s, key, n) === undefined) return n;
  }
  return null;
}

/** A cena que pede a resposta: o fim da cena de depois do evento pendente. */
export function pickScene(s: CampaignState, key: string): Scene {
  const n = pendingPick(s, key);
  const ev = n ? bondEvent(key, n) : undefined;
  if (!ev) return [];
  const after = eventScenes(ev, s.bondRoutes[key]).after;
  return after.slice(-1);
}

/** Grava a resposta do evento pendente, aplica a afinidade pelo tom e devolve a fala que vem depois. */
export function choosePick(s0: CampaignState, key: string, option: number): { state: CampaignState; then: Scene; before: number; after: number } {
  const n = pendingPick(s0, key);
  const opt = n ? pickOf(bondEvent(key, n))?.options[option] : undefined;
  if (!n || !opt) throw new Error(`sem resposta pendente com ${key}`);
  const s = clone(s0);
  s.bondPicks = { ...s.bondPicks, [key]: { ...s.bondPicks?.[key], [n]: option } };
  const { before, after } = addAffinity(s, key, PICK_POINTS[opt.tone]);
  return { state: s, then: opt.then, before, after };
}

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
  const picked = pickedOption(s, key, n);
  const pick = picked !== undefined ? pickOf(ev)?.options[picked]?.then ?? [] : [];
  return [...before, ...after, ...(route && choice ? choice[route].then : []), ...pick];
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
  const base = DIALOGUE.duelists[d.key].epilogue?.[route] ?? [];
  // As lembranças das escolhas feitas com o duelista, na ordem dos eventos, antes da última fala.
  const memories: Scene = [];
  for (let n = 1; n <= eventsDone(s, d.key); n++) {
    const i = pickedOption(s, d.key, n);
    const remember = i !== undefined ? pickOf(bondEvent(d.key, n))?.options[i]?.remember : undefined;
    if (remember) memories.push(...remember);
  }
  const scene = memories.length && base.length ? [...base.slice(0, -1), ...memories, ...base.slice(-1)] : base;
  return { duelist: d, route, scene };
}
