import { FORMAT } from '../game/format';

/** Os números da campanha: os do `CampaignBalance` do nativo (série Duel Monsters, Tier 1) e os dos tiers seguintes. */
export const BALANCE = {
  days: 30,
  /** Duelistas comuns por período (limitado aos que existem). */
  opponentsMin: 2,
  opponentsMax: 4,
  /** DP de uma vitória pelo tier do oponente (não pelo tier atual). */
  baseDPByTier: { 1: 300, 2: 400, 3: 500, 4: 600 } as Record<number, number>,
  /** Derrota, empate ou desistência: esta porcentagem da base do Tier 1 (60 DP), sem bônus. */
  healthyFinishThreshold: 50,
  healthyFinishBonus: 20,
  quickWinMaxTurns: 10,
  quickWinBonus: 20,
  flawlessBonus: 10,
  maxBonus: 50,
  consolationRate: 20,

  commonsPerPack: 4,
  slotOdds: [['rare', 70], ['super', 20], ['ultra', 10]] as const,
  packPrices: { lob: 150, mrd: 200, mrl: 200, psv: 225, lon: 250, lod: 250, pgd: 250, mfc: 300, dcr: 300, ioc: 300, ast: 350, sod: 350 } as Record<string, number>,
  characterPackPrice: 250,
  characterPackWins: 5,
  signatureWins: 5,
  boxSize: 20,
  boxDiscountPercent: 10,
  /** Dias em que uma coleção recém-chegada à loja aparece como nova. */
  newCollectionDays: 7,

  pointsPerHeart: 100,
  bondEvents: 6,
  bondChoiceEvent: 3,
  /** O evento que dá a carta do laço (o 6º fecha a história sem carta; change lacos-ate-o-fim). */
  bondGiftEvent: 4,
  /** Tier mínimo para abrir o evento (os que não estão aqui abrem em qualquer tier). */
  bondEventTier: { 5: 2, 6: 3 } as Record<number, number>,
  /** Afinidade da escolha dentro do evento, pelo tom da opção. */
  bondPickGood: 20,
  bondPickNeutral: 5,
  bondPickBad: -10,
  bondWinPoints: 30,
  bondLossPoints: 10,
  conversationLikedPoints: 20,
  conversationDislikedPoints: -15,
  conversationRumorsPoints: 5,
  closeGreetingHearts: 2,

  startingLifePoints: FORMAT.lp,
} as const;

export { LIMITED, MAX_COPIES } from '../game/decks';
