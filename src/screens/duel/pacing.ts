/**
 * Ritmo provisório da encenação, como o `DuelPacing` do nativo: a CPU "pensa" antes de cada jogada e a carta ativada
 * fica em destaque antes do próximo passo. Toca os `steps` do motor com pausas, em vez de pular direto ao resultado.
 * Será substituído pela fila de animação (`anim/queue.ts`, change `animar-duelo`), com os tempos no `PACING`.
 */
import type { Step } from '../../engine/protocol';
import { PACING } from './anim/pacing';

/** A CPU "pensa" antes de cada jogada (`cpuThink` do nativo). */
export const CPU_THINK_MS = PACING.think.block;
/** Tempo de cada carta no destaque de ativação. */
export const SHOWCASE_MS = 1300;

/**
 * Espera antes de cada step e antes do resultado final (último item). O primeiro beat de cada jogada da CPU (`think`)
 * espera o tempo de pensar; depois de uma ativação, o próximo espera o destaque, para o tabuleiro não mudar por baixo
 * dele. Se a CPU agiu, o resultado final também espera o tempo de pensar, para a última jogada dela ser vista. As
 * jogadas do próprio jogador não têm pausa: a resposta ao toque continua imediata.
 */
export function playbackDelays(steps: Step[]): number[] {
  const delays: number[] = [];
  let showing = 0;
  let cpu = false;
  for (const s of steps) {
    delays.push((s.think ? CPU_THINK_MS : 0) + showing);
    cpu ||= !!s.think;
    showing = s.beat.k === 'activate' ? SHOWCASE_MS : 0;
  }
  delays.push((cpu ? CPU_THINK_MS : 0) + showing);
  return delays;
}
