/** Pacotes da campanha: catálogo, preço, liberação, compra e conteúdo (`Campaign+Packs` do nativo). */
import { BALANCE } from './balance';
import { CAMPAIGN, PACKS, type PackData, type Rarity } from './data/types';
import { PURPOSE, generator, randInt, type Rng } from './rng';
import { addCards, clone, copies, type CampaignState } from './state';

export const packByKey = (key: string): PackData | undefined => PACKS.find((p) => p.key === key);

interface Release { key: string; opensFrom: number }
/** As coleções do tier, na ordem do dia em que chegam (e do arquivo no empate). */
const RELEASES: Release[] = CAMPAIGN.tier.packs
  .map((p, i) => ({ r: typeof p === 'string' ? { key: p, opensFrom: 1 } : p, i }))
  .sort((a, b) => a.r.opensFrom - b.r.opensFrom || a.i - b.i)
  .map((x) => x.r);

export const isCharacterPack = (p: PackData) => !!p.duelist;

export function price(p: PackData): number | null {
  return isCharacterPack(p) ? BALANCE.characterPackPrice : BALANCE.packPrices[p.key] ?? null;
}
/** A caixa: 20 pacotes com 10% de desconto, arredondado para baixo na dezena. */
export function boxPrice(p: PackData): number | null {
  const one = price(p);
  return one === null ? null : Math.floor((one * BALANCE.boxSize * (100 - BALANCE.boxDiscountPercent)) / 100 / 10) * 10;
}

export type Lock = { kind: 'day'; day: number } | { kind: 'wins'; duelist: string; name: string; wins: number; goal: number };
export interface ShopEntry { pack: PackData; lock: Lock | null; isNew: boolean }

const openReleases = (s: CampaignState) => RELEASES.filter((r) => r.opensFrom <= s.day);

/** As coleções à venda hoje (na ordem de chegada). A última é a "mais recente". */
export const collectionPacks = (s: CampaignState): PackData[] =>
  openReleases(s).map((r) => packByKey(r.key)).filter((p): p is PackData => !!p);

/** Coleções à venda e, apagadas, as do próximo dia de chegada. */
export function collectionListing(s: CampaignState): ShopEntry[] {
  const forSale = openReleases(s).flatMap((r) => {
    const pack = packByKey(r.key);
    return pack ? [{ pack, lock: null, isNew: r.opensFrom > 1 && s.day - r.opensFrom < BALANCE.newCollectionDays }] : [];
  });
  const next = RELEASES.map((r) => r.opensFrom).filter((d) => d > s.day).sort((a, b) => a - b)[0];
  const upcoming = next === undefined ? [] : RELEASES.filter((r) => r.opensFrom === next).flatMap((r) => {
    const pack = packByKey(r.key);
    return pack ? [{ pack, lock: { kind: 'day' as const, day: r.opensFrom }, isNew: false }] : [];
  });
  return [...forSale, ...upcoming];
}

/** Pacotes de personagem, liberados com 5 vitórias contra o dono. */
export function characterListing(s: CampaignState): ShopEntry[] {
  return CAMPAIGN.tier.duelists.flatMap((d) => {
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
