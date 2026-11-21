/**
 * Tipos dos dados da campanha montados pelo `scripts/copy_campaign_data.py`: o Tier 1 do app nativo (esquema do
 * `campaign.json`, `dialogue.json` e `packs.json` do duel-academy) mais os tiers do `tiers.json` e os decks do
 * `decks.json` (change `campanha-tiers`).
 */
import campaignJson from './campaign.json';
import dialogueJson from './dialogue.json';
import packsJson from './packs.json';

export type Expression = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'blushing';

export interface DeckEntry { id: number; count: number; comment?: string }
export interface CardRef { id: number; comment?: string }

/** Ponto do panorama onde uma cabeça pode aparecer (frações da largura e da altura). */
export interface MapPoint { x: number; y: number }
/** A cena do encontro: fundo (`public/campaign/bg-<bg>.jpg`) e o nome do lugar no topo. */
export interface SceneRef { bg: string; place: string }

export interface DuelistData {
  key: string;
  name: string;
  isBoss: boolean;
  /** Tem laço (corações, conversa, eventos, epílogo): só os do Tier 1. */
  bond: boolean;
  scene: SceneRef;
  signatureCard: CardRef;
  bondGift?: CardRef;
  deck: { name: string; main: DeckEntry[]; extra: DeckEntry[] };
}

/** Coleção do tier: chega `offset` dias depois de o tier abrir. */
export interface PackRelease { key: string; offset: number }

export interface TierData {
  number: number;
  name: string;
  firstDay: number;
  lastDay: number;
  packs: PackRelease[];
  /** Vazio = tier sem conteúdo ainda (não abre). */
  duelists: DuelistData[];
}

export interface CampaignData {
  starterDeck: { name: string; main: DeckEntry[]; cut: DeckEntry[] };
  startingPacks: string[];
  mapPoints: MapPoint[];
  tiers: TierData[];
}

/** Uma fala. `speaker` é a chave do duelista ou "player"; no vovô, a fala não traz `speaker`. */
export interface Line { speaker?: string; expression: Expression; text: string }
export type Scene = Line[];

export interface Topic { liked: Scene; disliked?: Scene }

/**
 * Escolha de resposta no fim de um evento (change lacos-ate-o-fim): 2 ou 3 opções. O tom dá a afinidade (BALANCE);
 * `remember` toca no epílogo se a opção foi a escolhida.
 */
export type PickTone = 'good' | 'neutral' | 'bad';
export interface BondPickOption { label: string; tone: PickTone; then: Scene; remember?: Scene }
export interface BondPick { prompt?: string; options: BondPickOption[] }

export interface BondEventSimple { title: string; before: Scene; after: Scene; pick?: BondPick }
export interface BondEventChoice extends BondEventSimple {
  choice: { friendship: { label: string; then: Scene }; romance: { label: string; then: Scene } };
}
export interface BondEventRoutes {
  title: string;
  friendship: { before: Scene; after: Scene };
  romance: { before: Scene; after: Scene };
  pick?: BondPick;
}
export type BondEvent = BondEventSimple | BondEventChoice | BondEventRoutes;

export interface DuelistDialogue {
  greeting: Scene[];
  /** Saudação do primeiro encontro (Tier 2 em diante); sem ela, vale a comum. */
  firstGreeting?: Scene[];
  beforeDuel: Scene[];
  playerWins: Scene[];
  playerLoses: Scene[];
  firstWin: Scene;
  bossEntrance?: Scene;
  bossDefeat?: Scene;
  /** Só quem tem laço (Tier 1). */
  conversation?: { duels: Topic; school: Topic; hobbies: Topic; rumors: Topic };
  bondEvents?: BondEvent[];
  bondGreetings?: { close: Scene[]; friendship: Scene[]; romance: Scene[] };
  epilogue?: { friendship: Scene; romance: Scene };
}

export interface ShopkeeperDialogue {
  character: string;
  welcome: Line[];
  boughtPack: Line[];
  boughtBox: Line[];
  pulledUltra: Line[];
  noFunds: Line[];
}

export interface DialogueData { duelists: Record<string, DuelistDialogue>; shopkeeper: ShopkeeperDialogue }

export type Rarity = 'common' | 'rare' | 'super' | 'ultra';
export interface PackData {
  key: string;
  name: string;
  shortName?: string;
  /** Pacote de personagem: a chave do duelista dono. */
  duelist?: string;
  cards: { id: number; rarity: Rarity }[];
}

export const CAMPAIGN = campaignJson as unknown as CampaignData;
/** Os tiers com conteúdo e sem, em ordem. */
export const TIERS: readonly TierData[] = CAMPAIGN.tiers;
/** Todos os duelistas, na ordem dos tiers (a posição entra nos sorteios por duelista: o Tier 1 vem primeiro). */
export const DUELISTS: readonly DuelistData[] = TIERS.flatMap((t) => t.duelists);
const TIER_OF = new Map(TIERS.flatMap((t) => t.duelists.map((d) => [d.key, t] as const)));
export const duelistByKey = (key: string): DuelistData | undefined => DUELISTS.find((d) => d.key === key);
/** O tier a que o duelista pertence. */
export const tierOfDuelist = (key: string): TierData | undefined => TIER_OF.get(key);
export const tierByNumber = (n: number): TierData | undefined => TIERS.find((t) => t.number === n);
export const DIALOGUE = dialogueJson as unknown as DialogueData;
export const PACKS = packsJson as unknown as PackData[];
