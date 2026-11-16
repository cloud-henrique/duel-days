/**
 * Tipos dos dados da campanha copiados do app nativo (`scripts/copy_campaign_data.py`). Espelham o esquema do
 * `campaign.json`, `dialogue.json` e `packs.json` do duel-academy, só a parte do Duel Monsters, Tier 1.
 */
import campaignJson from './campaign.json';
import dialogueJson from './dialogue.json';
import packsJson from './packs.json';

export type Expression = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'blushing';

export interface DeckEntry { id: number; count: number; comment?: string }
export interface CardRef { id: number; comment?: string }

export interface LocationData { key: string; name: string; icon: string; x: number; y: number; isShop?: boolean }

export interface DuelistData {
  key: string;
  name: string;
  isBoss: boolean;
  location: string;
  signatureCard: CardRef;
  bondGift?: CardRef;
  deck: { name: string; main: DeckEntry[]; extra: DeckEntry[] };
}

export type PackSlot = string | { key: string; opensFrom: number };

export interface TierData {
  number: number;
  name: string;
  firstDay: number;
  lastDay: number;
  packs: PackSlot[];
  locations: LocationData[];
  duelists: DuelistData[];
}

export interface CampaignData {
  starterDeck: { name: string; main: DeckEntry[] };
  startingPacks: string[];
  tier: TierData;
}

/** Uma fala. `speaker` é a chave do duelista ou "player"; no vovô, a fala não traz `speaker`. */
export interface Line { speaker?: string; expression: Expression; text: string }
export type Scene = Line[];

export interface Topic { liked: Scene; disliked?: Scene }

export interface BondEventSimple { title: string; before: Scene; after: Scene }
export interface BondEventChoice extends BondEventSimple {
  choice: { friendship: { label: string; then: Scene }; romance: { label: string; then: Scene } };
}
export interface BondEventRoutes {
  title: string;
  friendship: { before: Scene; after: Scene };
  romance: { before: Scene; after: Scene };
}
export type BondEvent = BondEventSimple | BondEventChoice | BondEventRoutes;

export interface DuelistDialogue {
  greeting: Scene[];
  beforeDuel: Scene[];
  playerWins: Scene[];
  playerLoses: Scene[];
  firstWin: Scene;
  bossEntrance?: Scene;
  bossDefeat?: Scene;
  conversation: { duels: Topic; school: Topic; hobbies: Topic; rumors: Topic };
  bondEvents: BondEvent[];
  bondGreetings: { close: Scene[]; friendship: Scene[]; romance: Scene[] };
  epilogue: { friendship: Scene; romance: Scene };
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
export const DIALOGUE = dialogueJson as unknown as DialogueData;
export const PACKS = packsJson as unknown as PackData[];
