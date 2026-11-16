/**
 * Liga a fila (`runSteps`) à tela: encena os steps de cada resposta do motor, mantém `staging` (a mão e os botões
 * travados) enquanto a fila corre e acelera com um toque. O resto (ordem, travas, velocidade) é da fila; o DOM é do
 * `play.ts`.
 */
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Board, Step } from '../../../engine/protocol';
import { rlog } from '../../../debug/remote';
import { IMPACT_AT, playGroup } from './play';
import { sfx } from '../../../audio/sfx';
import { effectFor } from './effects';
import { NO_CHAIN, nextChain, type ChainState } from './ChainStack';
import type { SplashState } from './Splash';
import type { TossState } from './Toss';
import { runSteps, type AnimSpeed } from './queue';

export interface StageIO {
  /** Mostra o step no narrador (quando a encenação dele começa). */
  announce: (step: Step) => void;
  /** Aplica um tabuleiro. */
  apply: (board: Board) => void;
}

export function useBeatQueue({ root, layer, speed, reducedMotion, faceOf }: {
  root: RefObject<HTMLElement | null>; layer: RefObject<HTMLElement | null>; speed: AnimSpeed; reducedMotion: boolean;
  /** A face da carta como DOM estático (a mesma do campo). */
  faceOf: (code: number) => HTMLElement | null;
}) {
  const [staging, setStaging] = useState(false);
  // Camadas em React (destaque de ativação e pilha da corrente), alimentadas pelos beats que a fila toca.
  const [splash, setSplash] = useState<SplashState | null>(null);
  const [chain, setChain] = useState<ChainState>(NO_CHAIN);
  const [toss, setToss] = useState<TossState | null>(null);
  const splashKey = useRef(0);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearLayers = () => { for (const t of timers.current.splice(0)) window.clearTimeout(t); setSplash(null); setChain(NO_CHAIN); setToss(null); };
  // Lidos na hora de tocar: a fila é disparada de um handler criado uma vez (o do motor).
  const opts = useRef({ speed, reducedMotion, faceOf });
  opts.current = { speed, reducedMotion, faceOf };
  const hurried = useRef(false);
  const ctl = useRef<AbortController | null>(null);
  const cleanups = useRef<(() => void)[]>([]);
  const flush = () => { for (const f of cleanups.current.splice(0)) { try { f(); } catch { /* só visual */ } } };

  /** Encena os steps; `true` se terminou, `false` se foi cancelada (o último tabuleiro já foi aplicado). */
  const run = async (steps: Step[], io: StageIO): Promise<boolean> => {
    ctl.current?.abort();
    const c = new AbortController();
    ctl.current = c;
    hurried.current = false;
    const { speed: sp, reducedMotion: rm, faceOf: face } = opts.current;
    if (steps.length && sp !== 'off') setStaging(true);
    try {
      await runSteps(steps, {
        speed: sp, reducedMotion: rm, signal: c.signal, hurried: () => hurried.current,
        announce: io.announce,
        apply: (b) => { flush(); io.apply(b); },
        play: (group, factor) => {
          for (const { beat } of group) {
            const e = effectFor(beat, { reducedMotion: rm });
            // Som no começo do beat; o do ataque, no impacto.
            if (e.sound) sfx.play(e.sound, e.kind === 'attack' ? (e.durations.lunge ?? 0) * IMPACT_AT * factor : 0);
            if (beat.k === 'activate' || beat.k === 'chainSolve' || beat.k === 'turn') setChain((ch) => nextChain(ch, beat));
            if (e.kind === 'splash' && beat.k === 'activate') {
              const ms = e.durations.splash * factor;
              const key = ++splashKey.current;
              setSplash({ code: beat.code, p: beat.p, key, ms, scaleFrom: e.scaleFrom ?? 1 });
              later(() => setSplash((sp) => (sp?.key === key ? null : sp)), ms);
            }
            // Moeda/dado: gira e mostra o resultado (com "reduzir movimento", só o resultado).
            if (beat.k === 'toss') {
              const spinMs = (e.durations.spin ?? 0) * factor, captionMs = (e.durations.caption ?? 0) * factor;
              const key = ++splashKey.current;
              setToss({ what: beat.what, p: beat.p, results: beat.results, key, spinMs, captionMs });
              later(() => setToss((t) => (t?.key === key ? null : t)), Math.max(spinMs + captionMs, e.block * factor));
            }
            // O elo 1 resolvido encerra a corrente: a pilha some depois do destaque dele.
            if (beat.k === 'chainSolve' && beat.link === 1 && beat.result === 'ok') {
              later(() => setChain((ch) => (ch.current === 1 ? NO_CHAIN : ch)), (e.durations.highlight ?? 0) * factor);
            }
          }
          if (!root.current || !layer.current) return;
          try { cleanups.current.push(playGroup(group, factor, { root: root.current, layer: layer.current, reducedMotion: rm, faceOf: face })); }
          catch (e) { rlog(`animação falhou: ${String((e as Error)?.message ?? e)}`); }
        },
      });
    } finally {
      flush();
      if (ctl.current === c) { ctl.current = null; setStaging(false); }
    }
    return !c.signal.aborted;
  };
  const cancel = () => { ctl.current?.abort(); clearLayers(); };
  const hurry = () => { hurried.current = true; };
  useEffect(() => () => { ctl.current?.abort(); flush(); for (const t of timers.current) window.clearTimeout(t); }, []);
  return { run, cancel, hurry, staging, splash, chain, toss };
}
