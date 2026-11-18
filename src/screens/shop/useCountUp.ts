import { useEffect, useRef, useState } from 'react';
import { SHOP_PACING } from './pacing';

/**
 * Conta do valor mostrado até `value` em `SHOP_PACING.countMs` e marca `pulse` no fim (o `GameCountingNumber` do
 * nativo). Com movimento reduzido (ou na primeira vez), troca direto.
 */
export function useCountUp(value: number, reduced: boolean): { shown: number; pulse: boolean } {
  const [shown, setShown] = useState(value);
  const [pulse, setPulse] = useState(false);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (start === value) return;
    if (reduced || typeof requestAnimationFrame !== 'function') { setShown(value); return; }
    let raf = 0, t0 = 0, off: ReturnType<typeof setTimeout> | undefined;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / SHOP_PACING.countMs);
      const eased = 1 - (1 - k) ** 3;
      setShown(Math.round(start + (value - start) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
      else { setPulse(true); off = setTimeout(() => setPulse(false), SHOP_PACING.pulseMs); }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); if (off) clearTimeout(off); };
  }, [value, reduced]);
  return { shown, pulse };
}
