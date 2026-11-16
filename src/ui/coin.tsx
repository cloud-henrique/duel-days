/**
 * Moeda e dado desenhados do jogo (como os do app nativo, que os jogos não têm para usar). Os dois giram com a Web
 * Animations e param no resultado; com "reduzir movimento" (`reduced`) ou `spinMs` 0, já aparecem parados.
 * A mesma moeda serve à abertura do duelo e aos efeitos de carta.
 */
import { useEffect, useId, useRef } from 'react';
import './coin.css';

export type CoinSide = 'heads' | 'tails';
/** Três voltas, mais meia para parar na coroa. */
const COIN_TURNS = 3;
const DIE_TURNS = 2;
const EASE = 'cubic-bezier(.2,.7,.3,1)';

/** Ângulo final da moeda: voltas inteiras, mais meia volta se caiu coroa. */
export const coinAngle = (side: CoinSide, turns = COIN_TURNS) => turns * 360 + (side === 'tails' ? 180 : 0);

function CoinFace({ label }: { label: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 100" className="coinface" aria-hidden="true">
      <defs>
        <radialGradient id={`g${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff6c4" /><stop offset=".45" stopColor="#f2c23a" /><stop offset="1" stopColor="#a86c00" />
        </radialGradient>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe28a" /><stop offset="1" stopColor="#8a5400" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#r${id})`} />
      <circle cx="50" cy="50" r="42" fill={`url(#g${id})`} />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#b8860b" strokeWidth="1.5" opacity=".7" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="coinlabel"
        fontSize={label.length > 4 ? 15 : 17}>{label}</text>
    </svg>
  );
}

/** Moeda dourada com CARA e COROA. `side`: onde ela para. */
export function Coin({ side, spinMs, reduced = false, size = 84, spinKey }: { side: CoinSide; spinMs: number; reduced?: boolean; size?: number; spinKey?: unknown }) {
  const el = useRef<HTMLDivElement>(null);
  const still = reduced || spinMs <= 0;
  useEffect(() => {
    if (still || !el.current) return;
    const a = el.current.animate([{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${coinAngle(side)}deg)` }], { duration: spinMs, easing: EASE, fill: 'both' });
    return () => a.cancel();
  }, [spinKey, side, spinMs, still]);
  return (
    <div className="coin3d" style={{ width: size, height: size }} data-side={side} role="img" aria-label={side === 'heads' ? 'Cara' : 'Coroa'}>
      <div ref={el} className="coinspin" style={still ? { transform: `rotateY(${side === 'tails' ? 180 : 0}deg)` } : undefined}>
        <div className="coinside heads"><CoinFace label="CARA" /></div>
        <div className="coinside tails"><CoinFace label="COROA" /></div>
      </div>
    </div>
  );
}

/** Posições dos pontos (grade 3×3, índices 0–8) de cada número do dado. */
export const DIE_PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

/** Dado claro com os pontos do resultado. */
export function Die({ value, spinMs, reduced = false, size = 72, spinKey }: { value: number; spinMs: number; reduced?: boolean; size?: number; spinKey?: unknown }) {
  const el = useRef<HTMLDivElement>(null);
  const still = reduced || spinMs <= 0;
  useEffect(() => {
    if (still || !el.current) return;
    const a = el.current.animate([{ transform: 'rotate(0deg) scale(.7)' }, { transform: `rotate(${DIE_TURNS * 360}deg) scale(1)` }], { duration: spinMs, easing: EASE, fill: 'both' });
    return () => a.cancel();
  }, [spinKey, value, spinMs, still]);
  const pips = DIE_PIPS[value] ?? [];
  return (
    <div ref={el} className="die3d" style={{ width: size, height: size }} role="img" aria-label={`Dado: ${value}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect x="4" y="4" width="92" height="92" rx="18" className="diebody" />
        {pips.map((p) => <circle key={p} className="diepip" cx={25 + (p % 3) * 25} cy={25 + Math.floor(p / 3) * 25} r="8.5" />)}
      </svg>
    </div>
  );
}
