/**
 * Os tempos da loja (os do nativo: `CascadeIn`, `ShakeEffect`, rasgo e giro do `PackOpeningView`, o balão do
 * `ShopCounter`). Espelha o `PACING` do duelo, mas é só da loja.
 */
export const SHOP_PACING = {
  /** Cascata da vitrine: atraso entre capas, quanto sobe e quanto dura. */
  cascadeStepMs: 40, cascadeRisePx: 14, cascadeMs: 250,
  /** Toque numa capa: pulso; numa bloqueada: balanço. */
  pressMs: 150, shakeMs: 400, shakePx: 4,
  /** O balão de fala some sozinho depois disto. */
  speechMs: 4000,
  /** O saldo conta até o valor novo. */
  countMs: 600, pulseMs: 220,
  /** Rasgo do pacote e giro de cada carta. */
  tearMs: 350, flipMs: 450,
  /** As cartas entram de baixo, uma depois da outra. */
  dealStepMs: 70, dealMs: 300,
} as const;
