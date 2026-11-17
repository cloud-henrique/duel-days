/** Pacotes da campanha: catálogo, preço, liberação, compra e conteúdo (`Campaign+Packs` do nativo). */
import { BALANCE } from './balance';
import { DUELISTS, PACKS, TIERS, type PackData, type Rarity, type TierData } from './data/types';
import { PURPOSE, generator, randInt, type Rng } from './rng';
import { addCards, clone, copies, type CampaignState } from './state';
import { currentTier, hasContent, isTierOpen, nextTier, tierOpenDay } from './tiers';

export const packByKey = (key: string): PackData | undefined => PACKS.find((p) => p.key === key);

interface Release { key: string; tier: TierData; offset: number; order: number }
/** As coleções de todos os tiers, na ordem do arquivo. */
const RELEASES: Release[] = TIERS.flatMap((tier) => tier.packs.map((p) => ({ key: p.key, tier, offset: p.offset, order: 0 })))
  .map((r, order) => ({ ...r, order }));

/** O dia em que a coleção chega à loja (tier aberto + `offset`), ou null com o tier fechado. */
function releaseDay(s: CampaignState, r: Release): number | null {
  const open = tierOpenDay(s, r.tier.number);
  return open === null ? null : open + r.offset;
}
/** À venda: o tier aberto e chegou o dia (a do dia da abertura vale assim que o tier abre, mesmo num save antigo). */
const isReleased = (s: CampaignState, r: Release) => {
  const day = releaseDay(s, r);
  return day !== null && (r.offset === 0 || s.day >= day);
};

export const isCharacterPack = (p: PackData) => !!p.duelist;

export function price(p: PackData): number | null {
  return isCharacterPack(p) ? BALANCE.characterPackPrice : BALANCE.packPrices[p.key] ?? null;
}
/** A caixa: 20 pacotes com 10% de desconto, arredondado para baixo na dezena. */
export function boxPrice(p: PackData): number | null {
  const one = price(p);
  return one === null ? null : Math.floor((one * BALANCE.boxSize * (100 - BALANCE.boxDiscountPercent)) / 100 / 10) * 10;
}

export type Lock =
  | { kind: 'day'; day: number }
  | { kind: 'tier'; tier: number; day: number }
  | { kind: 'wins'; duelist: string; name: string; wins: number; goal: number };
export interface ShopEntry { pack: PackData; lock: Lock | null; isNew: boolean }

/** As coleções à venda, na ordem em que chegaram (e do arquivo no empate). */
const openReleases = (s: CampaignState) => RELEASES.filter((r) => isReleased(s, r))
  .sort((a, b) => releaseDay(s, a)! - releaseDay(s, b)! || a.order - b.order);

/** As coleções à venda hoje (na ordem de chegada). A última é a "mais recente". */
export const collectionPacks = (s: CampaignState): PackData[] =>
  openReleases(s).map((r) => packByKey(r.key)).filter((p): p is PackData => !!p);

/**
 * A vitrine: as coleções à venda; as do tier atual que ainda não chegaram (com o dia); e as do próximo tier, se ele já
 * tiver conteúdo (com o tier e o dia em que abre pelo prazo).
 */
export function collectionListing(s: CampaignState): ShopEntry[] {
  const entry = (key: string, lock: Lock | null, isNew: boolean): ShopEntry[] => {
    const pack = packByKey(key);
    return pack ? [{ pack, lock, isNew }] : [];
  };
  const forSale = openReleases(s).flatMap((r) => {
    const day = releaseDay(s, r)!;
    return entry(r.key, null, day > 1 && s.day - day < BALANCE.newCollectionDays);
  });
  const cur = currentTier(s);
  const soon = RELEASES.filter((r) => r.tier === cur && !isReleased(s, r))
    .flatMap((r) => entry(r.key, { kind: 'day', day: releaseDay(s, r)! }, false));
  const next = nextTier(s);
  const later = next && hasContent(next) && !isTierOpen(s, next.number)
    ? RELEASES.filter((r) => r.tier === next).flatMap((r) => entry(r.key, { kind: 'tier', tier: next.number, day: next.firstDay }, false))
    : [];
  return [...forSale, ...soon, ...later];
}

/** Pacotes de personagem, liberados com 5 vitórias contra o dono. */
export function characterListing(s: CampaignState): ShopEntry[] {
  return DUELISTS.flatMap((d) => {
    const pack = PACKS.find((p) => p.duelist === d.key);
    if (!pack) return [];
    const wins = s.victories[d.key] ?? 0, goal = BALANCE.characterPackWins;
    return [{ pack, lock: wins >= goal ? null : { kind: 'wins' as const, duelist: d.key, name: d.name, wins, goal }, isNew: false }];
  });
}

export const characterPacks = (s: CampaignState) => characterListing(s).filter((e) => !e.lock).map((e) => e.pack);
const forSale = (s: CampaignState, key: string) =>
  collectionPacks(s).some((p) => p.key === key) || characterPacks(s).some((p) => p.key === key);

export const canBuy = (s: CampaignState, key: string, box = false) => {
  const p = packByKey(key);
  const cost = p && (box ? boxPrice(p) : price(p));
  return !s.concluded && !!p && cost !== null && cost !== undefined && forSale(s, key) && s.dp >= cost;
};
export const missingDP = (s: CampaignState, p: PackData, box = false) => Math.max(0, ((box ? boxPrice(p) : price(p)) ?? 0) - s.dp);

export interface Pull { id: number; rarity: Rarity; isNew: boolean }
export interface PackOpening { packKey: string; pulls: Pull[] }
export const hasUltra = (o: PackOpening) => o.pulls.some((p) => p.rarity === 'ultra');

const ORDER: Rarity[] = ['rare', 'super', 'ultra'];
/** A raridade sorteada e, se o pacote não a tiver, as de baixo até a Rara e então as de cima. */
const slotCandidates = (r: Rarity): Rarity[] => {
  const i = ORDER.indexOf(r);
  return [...ORDER.slice(0, i + 1).reverse(), ...ORDER.slice(i + 1)];
};

function slotRarity(g: Rng): Rarity {
  let roll = randInt(g, 100);
  for (const [rarity, percent] of BALANCE.slotOdds) {
    if (roll < percent) return rarity;
    roll -= percent;
  }
  return 'rare';
}

/** 4 comuns (com repetição) e 1 carta de raridade. */
export function draw(pack: PackData, g: Rng): { id: number; rarity: Rarity }[] {
  const of = (r: Rarity) => pack.cards.filter((c) => c.rarity === r).map((c) => c.id);
  const out: { id: number; rarity: Rarity }[] = [];
  const commons = of('common');
  if (commons.length) for (let i = 0; i < BALANCE.commonsPerPack; i++) out.push({ id: commons[randInt(g, commons.length)], rarity: 'common' });
  const rarity = slotCandidates(slotRarity(g)).find((r) => of(r).length > 0);
  if (rarity) { const opts = of(rarity); out.push({ id: opts[randInt(g, opts.length)], rarity }); }
  return out;
}

/** Abre um pacote (muda `s`). "Nova" = sem cópias antes do pacote (ou da caixa, com `before`). */
function open(s: CampaignState, pack: PackData, before?: Record<string, number>): PackOpening {
  const drawn = draw(pack, generator(PURPOSE.pack, s.seed, s.packsOpened));
  s.packsOpened += 1;
  const ref = before ?? s.collection;
  const pulls = drawn.map((c) => ({ ...c, isNew: (ref[String(c.id)] ?? 0) === 0 }));
  addCards(s, drawn.map((c) => c.id));
  return { packKey: pack.key, pulls };
}

/** Compra e abre um pacote. */
export function buy(s0: CampaignState, key: string): { state: CampaignState; opening: PackOpening } {
  if (!canBuy(s0, key)) throw new Error(`não dá para comprar ${key}`);
  const s = clone(s0), pack = packByKey(key)!;
  s.dp -= price(pack)!;
  return { state: s, opening: open(s, pack) };
}

/** Compra e abre a caixa de 20. */
export function buyBox(s0: CampaignState, key: string): { state: CampaignState; openings: PackOpening[] } {
  if (!canBuy(s0, key, true)) throw new Error(`não dá para comprar a caixa de ${key}`);
  const s = clone(s0), pack = packByKey(key)!;
  s.dp -= boxPrice(pack)!;
  const before = { ...s.collection };
  return { state: s, openings: Array.from({ length: BALANCE.boxSize }, () => open(s, pack, before)) };
}

/** Abre o primeiro pacote ganho ainda fechado. */
export function openUnopened(s0: CampaignState): { state: CampaignState; opening: PackOpening } {
  if (s0.concluded || !s0.unopenedPacks.length) throw new Error('nenhum pacote fechado');
  const s = clone(s0);
  const key = s.unopenedPacks.shift()!;
  const pack = packByKey(key);
  if (!pack) throw new Error(`pacote desconhecido: ${key}`);
  return { state: s, opening: open(s, pack) };
}

export const isNewCard = (s: CampaignState, id: number) => copies(s, id) === 0;
