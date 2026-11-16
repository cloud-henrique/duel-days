import { GameIcon } from './icons';

/**
 * Dinheiro do jogo: o ícone de moedas, o número na fonte do jogo e "DP" ("500 DP"); com `delta`, o ganho ("+30 DP").
 * É o único jeito de mostrar DP nas telas (o campo do save continua `coins`).
 */
export function Dp({ value, delta = false, className }: { value: number; delta?: boolean; className?: string }) {
  const text = `${delta && value >= 0 ? '+' : ''}${value} DP`;
  return (
    <span className={`dp${className ? ` ${className}` : ''}`} aria-label={text}>
      <GameIcon name="dp" size={18} />
      <span className="num" aria-hidden="true">{delta && value >= 0 ? '+' : ''}{value}</span>
      <span className="dp-unit" aria-hidden="true">DP</span>
    </span>
  );
}
