/**
 * Tempos e parâmetros da encenação do duelo, em ms na velocidade normal (1×). É a **única** fonte desses números: a fila
 * lê as travas daqui e os efeitos leem as durações daqui (as keyframes de CSS não carregam durações).
 * - `block` é a trava: quanto a fila espera antes do próximo beat (a animação pode durar mais e correr por baixo).
 * - Os demais campos de cada beat são as durações das partes da animação.
 * Ponto de partida: a tabela do `design.md` do change `animar-duelo` (tempos do `DuelPresentation` nativo).
 */

/** Nenhuma trava isolada passa disto na velocidade normal (a abertura do duelo é a exceção e não mora aqui). */
export const MAX_BLOCK_MS = 1500;

export const PACING = {
  /** A CPU "pensa" antes de cada jogada (`cpuThink` do nativo). */
  think: { block: 700 },
  draw: { flight: 350, block: 300 },
  summon: { flight: 400, pillar: 750, block: 650 },
  set: { flight: 400, block: 400 },
  /** Virar para cima: giro 3D em Y com troca de face no meio (e giro de 90° junto, se mudar de posição). */
  reveal: { flip: 450, block: 450 },
  /** Só mudar de posição: giro entre 0° e 90°. */
  pos: { turn: 350, block: 350 },
  /** Destaque central: a trava é menor para Magia/Armadilha e menor ainda para efeito de monstro. */
  activate: { splash: 1100, block: 650, blockMonster: 400, scaleFrom: 0.6 },
  /** Pilha da corrente: só com 2+ elos. */
  chain: { highlight: 700, block: 700, scale: 1.15 },
  /** Recuo e avanço em fração do vetor entre os centros do atacante e do alvo; tremida em px. */
  attack: { lunge: 560, block: 440, recoil: -0.08, reach: 0.85, scale: 1.2, shake: [9, -7, 5, -2, 0] },
  /** Popup e contagem do LP na placa: correm em paralelo, sem trava. */
  lp: { popup: 1200, block: 0 },
  destroy: { shatter: 300, flight: 400, block: 650 },
  /** Voo direto (cemitério, mão, deck, Magia indo para a zona). */
  move: { flight: 400, block: 350 },
  banish: { fade: 350, block: 300 },
  equip: { flight: 400, pillar: 750, block: 650 },
  toss: { spin: 900, caption: 400, block: 1300 },
  turn: { block: 0 },
  /** Fade curto que substitui deslocamento, giro 3D e quebra com "reduzir movimento". */
  fade: { duration: 200, block: 250 },
  /**
   * Abertura do duelo (não é trava de beat; fica fora do teto): moeda e quem começa, faixas dos duelistas entrando,
   * "DUELO!", uma pausa e o fade de saída. Total ~2,9s; um toque pula.
   */
  intro: { coin: 900, starter: 400, banners: 450, title: 350, hold: 500, fade: 300 },
  /** Fim do duelo: o título entra com escala e o vencedor dá um pulo (px). */
  outro: { title: 500, jump: 600, jumpPx: 10 },
  /** Fator de tempo por velocidade; `hurry` é o toque para acelerar durante a fila. */
  speed: { normal: 1, fast: 0.5, hurry: 0.25 },
  /** O mesmo som não se repete em menos que isto. */
  sound: { repeatMs: 60 },
} as const;
