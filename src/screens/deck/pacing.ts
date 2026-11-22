/** Os tempos do editor (os do nativo: segurar para arrastar, voo da carta, gaveta e o aviso de recusa). */
export const DECK_PACING = {
  /** Segurar a carta este tempo começa o arraste; mexer mais que `slopPx` antes disso é rolagem. */
  holdMs: 300, slopPx: 8,
  /** Com mouse (change layout-desktop-telas) não há espera: o arraste começa ao mover mais que isto com o botão apertado. */
  mouseSlopPx: 4,
  /** A carta que volta (solta fora) ou some (solta no lugar). */
  flyMs: 300,
  /** A gaveta da maleta muda de posição. */
  drawerMs: 250,
  /** O aviso de recusa. */
  toastMs: 1600,
} as const;
