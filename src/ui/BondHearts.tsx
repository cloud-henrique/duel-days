/**
 * Os corações do laço (como o `BondHearts` do nativo): cada um é um "pote" escuro com borda rosada, enchido de baixo
 * para cima por um líquido em degradê (rosa → vermelho → vinho) com um reflexo; cheio, ganha borda clara e um brilho
 * vermelho atrás. `value` é em corações (1,5 = um cheio e o segundo pela metade).
 */
import { useId } from 'react';
import './bondhearts.css';

/** O coração em 100 × 90 (largura × altura), o mesmo desenho do `HeartShape` do nativo. */
const HEART = 'M50 88 C 22 66 2 50 2 28 C 2 12 14 2 28 2 C 38 2 46 8 50 16 C 54 8 62 2 72 2 C 86 2 98 12 98 28 C 98 50 78 66 50 88 Z';

function Heart({ fill, size }: { fill: number; size: number }) {
  const id = useId().replace(/:/g, '');
  const full = fill >= 1;
  const level = 90 * (1 - Math.min(Math.max(fill, 0), 1));
  return (
    <svg className={`bheart${full ? ' full' : ''}`} width={size} height={size * 0.9} viewBox="0 0 100 90" aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8cb3" />
          <stop offset=".5" stopColor="#f2264d" />
          <stop offset="1" stopColor="#990526" />
        </linearGradient>
        <radialGradient id={`r${id}`}><stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <clipPath id={`c${id}`}><path d={HEART} /></clipPath>
      </defs>
      <path d={HEART} fill="rgba(0,0,0,.45)" />
      <g clipPath={`url(#c${id})`}>
        <rect x="0" y={level} width="100" height={90 - level} fill={`url(#g${id})`} />
        {fill > 0 && <ellipse cx="32" cy="30" rx="12" ry="7" transform="rotate(-30 32 30)" fill={`url(#r${id})`} />}
      </g>
      <path d={HEART} fill="none" stroke={full ? 'rgba(255,255,255,.9)' : 'rgba(255,179,204,.45)'} strokeWidth="7" />
    </svg>
  );
}

export function BondHearts({ value, size = 18, count = 4 }: { value: number; size?: number; count?: number }) {
  const full = Math.floor(value);
  return (
    <span className="bondhearts" style={{ gap: size * 0.22 }} role="img"
      aria-label={`${full} de ${count} corações${value - full >= 0.5 ? ' e meio' : ''}`}>
      {Array.from({ length: count }, (_, i) => <Heart key={i} fill={value - i} size={size} />)}
    </span>
  );
}
