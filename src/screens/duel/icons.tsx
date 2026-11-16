/** Indicador de espera da tela de duelo (aguardando o oponente ou o motor). Os ícones do jogo ficam em `src/ui/icons.tsx`. */
export function Spinner() {
  return <svg viewBox="0 0 24 24" width="40" height="40" className="spin" aria-label="Aguardando"><g stroke="#cfd8e6" strokeWidth="2.6" strokeLinecap="round">{Array.from({ length: 8 }, (_, i) => <line key={i} x1="12" y1="2.5" x2="12" y2="7" opacity={0.25 + i * 0.1} transform={`rotate(${i * 45} 12 12)`} />)}</g></svg>;
}
