/**
 * Ritmo da encenação, como o `DuelPacing` do nativo: a CPU "pensa" antes de cada jogada e a carta ativada fica em
 * destaque antes do próximo passo. Sem isso, o turno do oponente inteiro chegava de uma vez (o motor resolve tudo
 * até o próximo pedido do jogador).
 */
import type { Frame } from '../../engine/protocol';

/** A CPU "pensa" antes de cada jogada (`cpuThink` do nativo). */
export const CPU_THINK_MS = 700;
/** Tempo de cada carta no destaque de ativação. */
export const SHOWCASE_MS = 1300;

const OPPONENT = 1;

/**
 * O quadro é da CPU agindo: no turno dela, ou uma resposta dela no turno do jogador (armadilha). As jogadas do próprio
 * jogador não têm pausa: a resposta ao toque continua imediata.
 */
export const isOpponentStep = (f: Frame) => f.board.turnPlayer === OPPONENT || f.shows.some((s) => s.controller === OPPONENT);

/**
 * Espera antes de cada quadro e antes do resultado final (último item). Um passo da CPU espera o tempo de pensar antes
 * dele, e o passo seguinte (dela ou do jogador) espera o mesmo para o resultado ser visto; depois de um quadro com
 * ativação, soma o tempo do destaque, para o tabuleiro não mudar por baixo dele.
 */
export function playbackDelays(frames: Frame[]): number[] {
  const delays: number[] = [];
  let showing = 0;
  let afterOpponent = false;
  for (const f of frames) {
    const opponent = isOpponentStep(f);
    delays.push((opponent || afterOpponent ? CPU_THINK_MS : 0) + showing);
    showing = f.shows.length * SHOWCASE_MS;
    afterOpponent = opponent;
  }
  delays.push((afterOpponent ? CPU_THINK_MS : 0) + showing);
  return delays;
}
