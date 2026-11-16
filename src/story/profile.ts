/**
 * Perfil do jogador (change visual-base): nome, avatar, tratamento e as estatísticas. Funções puras sobre o `Progress`;
 * os campos novos são opcionais no save e lidos sempre por `profileOf`, com os padrões dos saves antigos.
 */
import type { Progress } from './progress';

/** Tratamento nos textos com gênero. "Neutro" evita a palavra com gênero em vez de inventar terminação. */
export type Address = 'he' | 'she' | 'neutral';
export const ADDRESSES: [Address, string][] = [['he', 'Ele'], ['she', 'Ela'], ['neutral', 'Neutro']];

/**
 * Os avatares do jogador: os 14 duelistas genéricos do *Duel Links*, na ordem do app nativo (alunos e alunas da Escola
 * Domino, depois os de roupa casual). O id é a pasta em `public/characters`; o nome do *Duel Links* não aparece.
 */
export const PLAYER_AVATARS: { id: string; label: string }[] = [
  { id: 'npc_duelists_dm__andrew', label: 'Aluno de cabelo escuro e franja de lado' },
  { id: 'npc_duelists_dm__daniel', label: 'Aluno de cabelo loiro espetado' },
  { id: 'npc_duelists_dm__josh', label: 'Aluno de cabelo castanho' },
  { id: 'npc_duelists_dm__christine', label: 'Aluna de cabelo curto com presilhas' },
  { id: 'npc_duelists_dm__hailey', label: 'Aluna de rabo de cavalo de lado' },
  { id: 'npc_duelists_dm__jess', label: 'Aluna de cabelo longo azul-escuro' },
  { id: 'npc_duelists_common__ashley', label: 'Moça de cabelo preto liso e casaco azul' },
  { id: 'npc_duelists_common__bella', label: 'Menina de maria-chiquinha e moletom roxo' },
  { id: 'npc_duelists_common__david', label: 'Rapaz de cabelo preto e blazer cinza' },
  { id: 'npc_duelists_common__emma', label: 'Menina de rabo de cavalo de lado e moletom vermelho' },
  { id: 'npc_duelists_common__jay', label: 'Rapaz de cabelo castanho espetado e jaqueta verde' },
  { id: 'npc_duelists_common__meg', label: 'Moça de cabelo castanho curto e casaco rosa' },
  { id: 'npc_duelists_common__mickey', label: 'Menino de cabelo preto e jaqueta vermelha' },
  { id: 'npc_duelists_common__nick', label: 'Menino de cabelo castanho e jaqueta laranja' },
];
export const DEFAULT_AVATAR = PLAYER_AVATARS[0].id;
export const NAME_MAX = 20;

export interface Profile { name: string; avatar: string; address: Address }

/** Perfil com os padrões: avatar desconhecido ou ausente vira o primeiro; tratamento ausente vira neutro. */
export function profileOf(p: Pick<Progress, 'playerName'> & { avatar?: string; address?: Address }): Profile {
  const avatar = PLAYER_AVATARS.some((a) => a.id === p.avatar) ? p.avatar! : DEFAULT_AVATAR;
  const address: Address = p.address === 'he' || p.address === 'she' ? p.address : 'neutral';
  return { name: p.playerName, avatar, address };
}

/** Nome válido do perfil: sem espaços nas pontas, de 1 a 20 caracteres. */
export const cleanName = (s: string) => s.trim().slice(0, NAME_MAX);

/** Vitórias, derrotas (desistência e empate contam como derrota) e aproveitamento, somando todos os oponentes. */
export function playerStats(p: Pick<Progress, 'wins' | 'losses'>) {
  const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
  const wins = sum(p.wins), losses = sum(p.losses);
  const total = wins + losses;
  return { wins, losses, rate: total ? Math.round((wins / total) * 100) : null };
}

/** O texto conforme o tratamento: `say(address, { he: 'Bem-vindo', she: 'Bem-vinda', neutral: 'Boas-vindas' })`. */
export const say = (a: Address, forms: Record<Address, string>) => forms[a];

/** "Bem-vinda ao Duel Days, Ana!" (ou sem o nome). O "ao" é do jogo, então a forma neutra continua sem gênero. */
export const welcomeTitle = (a: Address, name?: string) => {
  const game = `${say(a, { he: 'Bem-vindo', she: 'Bem-vinda', neutral: 'Boas-vindas' })} ao Duel Days`;
  return name ? `${game}, ${name}!` : `${game}!`;
};
