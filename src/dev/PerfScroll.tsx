/**
 * Medidor de rolagem (`?perf`, só em dev ou com `?debug=1`): rola um contêiner de ponta a ponta em velocidade fixa,
 * conta os quadros e os quadros longos (> 50 ms) e mostra o resultado. O resultado também vai para o `/__log` (grava em
 * `/tmp/duel-days-device.log` no dev e no preview), para ler a medição do simulador ou do iPhone pelo Mac.
 */
import { useState, type RefObject } from 'react';

const BASE = import.meta.env.BASE_URL;
/** Velocidade da rolagem automática (pontos por segundo): `?perf=1000` escolhe; o padrão é um arrasto bem rápido. */
const speed = () => Number(new URLSearchParams(location.search).get('perf')) || 3000;

export interface ScrollStats { frames: number; ms: number; fps: number; long: number; worstMs: number; height: number }

export const perfEnabled = () => {
  const q = new URLSearchParams(location.search);
  return q.has('perf') && (import.meta.env.DEV || q.has('debug'));
};

/** FPS da página parada (sem rolar) por `ms`: o teto do aparelho/simulador, para comparar com a rolagem. */
export function idleFps(ms = 2000): Promise<number> {
  return new Promise((resolve) => {
    let start = 0, frames = 0;
    const step = (t: number) => {
      if (!start) start = t;
      frames++;
      if (t - start < ms) requestAnimationFrame(step); else resolve(Math.round((frames / (t - start)) * 1000));
    };
    requestAnimationFrame(step);
  });
}

/** Rola `el` do topo até o fim por `requestAnimationFrame` e devolve as estatísticas dos quadros. */
export function measureScroll(el: HTMLElement): Promise<ScrollStats> {
  return new Promise((resolve) => {
    el.scrollTop = 0;
    let start = 0, last = 0, frames = 0, long = 0, worst = 0, stuck = 0, prev = -1;
    const step = (t: number) => {
      if (!start) { start = last = t; requestAnimationFrame(step); return; }
      const dt = t - last;
      last = t; frames++;
      if (dt > 50) long++;
      worst = Math.max(worst, dt);
      // A altura pode mudar durante a rolagem (content-visibility, imagens): o fim é recalculado a cada quadro, e a
      // rolagem também termina se o scrollTop parar de andar por 10 quadros.
      const max = el.scrollHeight - el.clientHeight;
      el.scrollTop = Math.min(max, ((t - start) / 1000) * speed());
      stuck = el.scrollTop === prev ? stuck + 1 : 0;
      prev = el.scrollTop;
      if (el.scrollTop < max - 1 && stuck < 10) { requestAnimationFrame(step); return; }
      const ms = t - start;
      resolve({ frames, ms: Math.round(ms), fps: Math.round((frames / ms) * 1000), long, worstMs: Math.round(worst), height: el.scrollHeight });
    };
    requestAnimationFrame(step);
  });
}

/** Botão flutuante que mede a rolagem de `target` e mostra o resultado. */
export function PerfScroll({ target, label }: { target: RefObject<HTMLElement | null>; label: string }) {
  const [out, setOut] = useState<string>('Medir rolagem');
  const run = async () => {
    const el = target.current;
    if (!el) return;
    setOut('Medindo…');
    const base = await idleFps();
    const s = await measureScroll(el);
    const text = `${label} a ${speed()} pt/s: parado ${base} FPS; rolando ${s.fps} FPS, ${s.frames} quadros em ${s.ms} ms, ${s.long} longos (pior ${s.worstMs} ms), altura ${s.height}px, ${el.querySelectorAll('.cell').length} células`;
    setOut(text);
    fetch(`${BASE}__log`, { method: 'POST', body: `[perf] ${new Date().toISOString()} ${navigator.userAgent} ${text}`, keepalive: true }).catch(() => {});
    // Volta ao topo depois de 15 s (dá tempo de medir a memória no fim) e avisa, para medir de novo lá em cima.
    setTimeout(() => {
      el.scrollTop = 0;
      fetch(`${BASE}__log`, { method: 'POST', body: `[perf] ${new Date().toISOString()} ${navigator.userAgent} ${label}: voltou ao topo`, keepalive: true }).catch(() => {});
    }, 15000);
  };
  return (
    <button type="button" className="perfscroll" onClick={run}
      style={{ position: 'fixed', left: 8, bottom: 8, zIndex: 50, maxWidth: 'calc(100vw - 16px)', padding: '6px 10px', font: '600 12px/1.3 system-ui', color: '#fff', background: 'rgba(200,0,80,.9)', border: 0, borderRadius: 6, textAlign: 'left' }}>
      {out}
    </button>
  );
}
