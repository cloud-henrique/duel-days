/** Os números da campanha, os mesmos do `CampaignBalance` do nativo (série Duel Monsters, Tier 1). */
export const BALANCE = {
  days: 30,
  /** Duelistas comuns por período (limitado aos que existem). */
  opponentsMin: 2,
  opponentsMax: 4,

  /** DP de uma vitória contra o Tier 1. */
  baseDP: 300,
  healthyFinishThreshold: 50,
  healthyFinishBonus: 20,
  quickWinMaxTurns: 10,
  quickWinBonus: 20,
  flawlessBonus: 10,
  maxBonus: 50,
  /** Derrota, empate ou desistência: esta porcentagem da base, sem bônus. */
  consolationRate: 20,

  commonsPerPack: 4,
  slotOdds: [['rare', 70], ['super', 20], ['ultra', 10]] as const,
  packPrices: { lob: 150, mrd: 200, mrl: 200, psv: 225 } as Record<string, number>,
  characterPackPrice: 250,
  characterPackWins: 5,
  signatureWins: 10,
  boxSize: 20,
  boxDiscountPercent: 10,
  /** Dias em que uma coleção recém-chegada à loja aparece como nova. */
  newCollectionDays: 7,

  pointsPerHeart: 100,
  bondEvents: 4,
  bondChoiceEvent: 3,
  bondWinPoints: 30,
  bondLossPoints: 10,
  conversationLikedPoints: 20,
  conversationDislikedPoints: -15,
  conversationRumorsPoints: 5,
  closeGreetingHearts: 2,

  startingLifePoints: 8000,
} as const;

export { LIMITED, MAX_COPIES } from '../game/decks';
