/**
 * Moeda e dado desenhados do jogo (como os do app nativo, que os jogos não têm para usar). Os dois giram com a Web
 * Animations e param no resultado; com "reduzir movimento" (`reduced`) ou `spinMs` 0, já aparecem parados.
 * A mesma moeda serve à abertura do duelo e aos efeitos de carta.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { PACING } from '../screens/duel/anim/pacing';
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

/**
 * Moeda do WCT 2004 (GBA) em pixel art, quando o arquivo existe (`public/sprites/coin.png`, fora do git: gerado pelo
 * `scripts/copy_coin_sprite.py`). Strip de 17 quadros 32×32; sem ele, a moeda desenhada abaixo.
 */
const SPRITE = `${import.meta.env.BASE_URL}sprites/coin.png`;
const CELL = 32;
export const COIN_FRAMES = {
  heads: 0, tails: 6, shine: 6,
  /** Meia volta de cara para coroa e de coroa para cara (inclinada, de lado, a outra face por baixo). */
  toTails: [12, 14, 16], toHeads: [13, 14, 15],
  count: 17,
} as const;

/** Quadros do giro: meias voltas alternando as faces, terminando no lado que caiu. */
export function coinFrames(side: CoinSide, turns = COIN_TURNS): number[] {
  const halves = turns * 2 + (side === 'tails' ? 1 : 0);
  const out: number[] = [COIN_FRAMES.heads];
  let up: CoinSide = 'heads';
  for (let i = 0; i < halves; i++) {
    out.push(...(up === 'heads' ? COIN_FRAMES.toTails : COIN_FRAMES.toHeads));
    up = up === 'heads' ? 'tails' : 'heads';
    out.push(COIN_FRAMES[up]);
  }
  return out;
}

let spriteOk: boolean | null = null;
const spriteWaiters = new Set<(ok: boolean) => void>();
if (typeof Image !== 'undefined' && typeof window !== 'undefined' && !import.meta.env.VITEST) {
  const img = new Image();
  img.onload = () => { spriteOk = true; spriteWaiters.forEach((f) => f(true)); };
  img.onerror = () => { spriteOk = false; spriteWaiters.forEach((f) => f(false)); };
  img.src = SPRITE;
}
function useCoinSprite() {
  const [ok, setOk] = useState(spriteOk === true);
  useEffect(() => {
    if (spriteOk !== null) { setOk(spriteOk); return; }
    spriteWaiters.add(setOk);
    return () => { spriteWaiters.delete(setOk); };
  }, []);
  return ok;
}

/** A moeda em pixel art: troca de quadro no giro (rápido no começo, devagar no fim), um pulo e o brilho ao cair. */
function SpriteCoin({ side, spinMs, still, size, spinKey }: { side: CoinSide; spinMs: number; still: boolean; size: number; spinKey?: unknown }) {
  const rest = COIN_FRAMES[side];
  const [frame, setFrame] = useState<number>(still ? rest : COIN_FRAMES.heads);
  const el = useRef<HTMLDivElement>(null);
  // Pixels inteiros: o tamanho arredonda para um múltiplo da célula de 32.
  const px = Math.max(CELL, Math.round(size / CELL) * CELL);
  useEffect(() => {
    if (still) { setFrame(rest); return; }
    const seq = coinFrames(side);
    const shine = PACING.toss.shineFrame;
    let raf = 0;
    const t0 = performance.now();
    const hop = el.current?.animate([{ transform: 'none' }, { transform: 'translateY(-28%)', offset: 0.35 }, { transform: 'none' }], { duration: spinMs, easing: 'ease-in-out' });
    const tick = (now: number) => {
      const t = now - t0;
      if (t < spinMs) {
        const p = 1 - (1 - t / spinMs) ** 3;
        setFrame(seq[Math.min(seq.length - 1, Math.floor(p * seq.length))]);
      } else {
        const k = Math.floor((t - spinMs) / shine);
        if (k >= COIN_FRAMES.shine) { setFrame(rest); return; }
        setFrame(rest + k);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); hop?.cancel(); };
  }, [spinKey, side, spinMs, still]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={el} className="coinsprite" style={{
      width: px, height: px, backgroundImage: `url(${SPRITE})`,
      backgroundSize: `${COIN_FRAMES.count * px}px ${px}px`, backgroundPosition: `-${frame * px}px 0`,
    }} />
  );
}

/** Moeda dourada com CARA e COROA. `side`: onde ela para. */
export function Coin({ side, spinMs, reduced = false, size = 84, spinKey }: { side: CoinSide; spinMs: number; reduced?: boolean; size?: number; spinKey?: unknown }) {
  const el = useRef<HTMLDivElement>(null);
  const still = reduced || spinMs <= 0;
  const sprite = useCoinSprite();
  useEffect(() => {
    if (sprite || still || !el.current) return;
    const a = el.current.animate([{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${coinAngle(side)}deg)` }], { duration: spinMs, easing: EASE, fill: 'both' });
    return () => a.cancel();
  }, [spinKey, side, spinMs, still, sprite]);
  if (sprite) return (
    <div className="coin3d pixel" data-side={side} role="img" aria-label={side === 'heads' ? 'Cara' : 'Coroa'}>
      <SpriteCoin side={side} spinMs={spinMs} still={still} size={size} spinKey={spinKey} />
    </div>
  );
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
