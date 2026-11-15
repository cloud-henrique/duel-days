/** Regras puras do LP na placa: contagem animada, cor da barra e texto da variação. */

export const START_LP = 8000;
/** A contagem do LP vai do valor antigo ao novo em LP_STEPS passos de LP_STEP_MS (como no app nativo). */
export const LP_STEPS = 24;
export const LP_STEP_MS = 30;
/** Tempo em que a variação ("−500") fica visível ao lado do LP. */
export const LP_POPUP_MS = 1200;
const HIGH = 0.5;
const LOW = 0.25;

/** Valor mostrado no passo `step` (0..LP_STEPS) da contagem de `from` até `to`. */
export function lpTween(from: number, to: number, step: number): number {
  const s = Math.max(0, Math.min(LP_STEPS, step));
  return Math.round(from + ((to - from) * s) / LP_STEPS);
}

export type LpTone = 'high' | 'mid' | 'low';
/** Cor da barra: verde a partir de 50% do LP inicial, amarela a partir de 25%, vermelha abaixo. */
export function lpTone(lp: number, start = START_LP): LpTone {
  const r = lp / start;
  return r >= HIGH ? 'high' : r >= LOW ? 'mid' : 'low';
}

/** Largura da barra em porcentagem (0..100). */
export const lpPercent = (lp: number, start = START_LP) => Math.max(0, Math.min(100, (lp / start) * 100));

/** Texto da variação com sinal: "−800" (sinal de menos tipográfico) ou "+500". */
export const lpDelta = (delta: number) => (delta < 0 ? `−${-delta}` : `+${delta}`);
