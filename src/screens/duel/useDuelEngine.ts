import { useEffect, useRef, useState } from 'react';
import type { OcgMessage, OcgResponse } from 'ocgcore-wasm';
import type { Board, Frame, FromWorker, Show, ToWorker } from '../../engine/protocol';
import type { DeckList } from '../../engine/session';
import { InlineEngine } from '../../engine/inline';
import { debugOn, engineInline, rlog } from '../../debug/remote';
import { art } from '../../components/CardSheet';
import { playbackDelays } from './pacing';

const BASE = import.meta.env.BASE_URL;
/** Sem resposta do motor por este tempo depois de uma jogada, a tela mostra o erro em vez de ficar parada. */
const WATCHDOG_MS = 12_000;
/** No modo diagnóstico, intervalo do ping ao Worker. */
const PING_MS = 2_000;
/** A semente do duelo vem do relógio, limitada a este valor. */
const SEED_RANGE = 100_000;
const DEBUG_LINES = 15;

export interface DuelEnd { text: string; won: boolean }

/**
 * Ciclo de vida do motor (Worker ou thread principal): inicia o duelo, recebe tabuleiro/prompt/eventos,
 * envia respostas e vigia travamentos.
 */
export function useDuelEngine({ mine, foe, foeName, onPrompt, onEvents, onShows, onLog }: {
  mine: DeckList; foe: DeckList; foeName: string;
  /** Chamado a cada novo pedido de jogada (antes de mostrar o prompt). */
  onPrompt: () => void;
  onEvents: (events: string[]) => void; onShows: (shows: Show[] | undefined) => void;
  /** Linha só para o histórico (ex.: erro do motor). */
  onLog: (line: string) => void;
}) {
  const worker = useRef<Worker | InlineEngine | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [prompt, setPrompt] = useState<OcgMessage | null>(null);
  const [info, setInfo] = useState('');
  const [ended, setEnded] = useState<DuelEnd | null>(null);
  const [fail, setFail] = useState<string | null>(null);
  const [dbg, setDbg] = useState<string[]>([]);
  const pong = useRef(0);
  const [, tick] = useState(0);
  const watchdog = useRef<number | undefined>(undefined);
  const clearDog = () => { window.clearTimeout(watchdog.current); watchdog.current = undefined; };
  const send = (m: ToWorker) => worker.current?.postMessage(m);

  // Reprodução: os quadros do motor (ex.: cada jogada da CPU) entram um por vez, com as pausas do `pacing`; o pedido
  // de jogada (ou o fim) só aparece depois do último.
  const playTimer = useRef<number | undefined>(undefined);
  const stopPlayback = () => { window.clearTimeout(playTimer.current); playTimer.current = undefined; };
  const showFrame = (f: Frame) => { setBoard(f.board); onEvents(f.events); onShows(f.shows); };
  const finish = (d: Extract<FromWorker, { t: 'prompt' | 'end' }>) => {
    if (d.t === 'prompt') { setBoard(d.board); setPrompt(d.msg); onPrompt(); onEvents(d.events); onShows(d.shows); return; }
    setBoard(d.board); setPrompt(null); onEvents(d.events); onShows(d.shows);
    setEnded({ text: d.winner === 0 ? 'Você venceu!' : `${foeName} venceu.`, won: d.winner === 0 });
  };
  const play = (d: Extract<FromWorker, { t: 'prompt' | 'end' }>) => {
    stopPlayback();
    const frames = d.frames ?? [];
    const delays = playbackDelays(frames);
    const step = (i: number) => {
      if (i < frames.length) showFrame(frames[i]);
      else { playTimer.current = undefined; finish(d); return; }
      next(i + 1);
    };
    const next = (i: number) => {
      // Sem espera, aplica na hora (as jogadas do próprio jogador não ficam para depois).
      if (delays[i] === 0) step(i);
      else playTimer.current = window.setTimeout(() => step(i), delays[i]);
    };
    next(0);
  };

  const start = () => {
    stopPlayback();
    worker.current?.terminate();
    const w = engineInline ? new InlineEngine() : new Worker(new URL('../../engine/worker.ts', import.meta.url), { type: 'module' });
    rlog(`motor: ${engineInline ? 'thread principal (inline)' : 'worker'}`);
    worker.current = w;
    w.onerror = (e: ErrorEvent) => { clearDog(); rlog(`worker.onerror: ${e.message}`); setFail(`Erro no motor: ${e.message || 'falha ao carregar o worker'}`); };
    w.onmessageerror = () => { clearDog(); rlog('worker.onmessageerror'); setFail('Erro ao ler a resposta do motor.'); };
    w.onmessage = (ev: MessageEvent<FromWorker>) => {
      const d = ev.data;
      if (d.t === 'pong') { pong.current = Date.now(); return; }
      if (d.t === 'debug') { rlog(`[motor] ${d.text}`); setDbg((l) => [...l.slice(-(DEBUG_LINES - 1)), `${new Date().toISOString().slice(17, 23)} ${d.text}`]); return; }
      clearDog();
      if (d.t !== 'ready') rlog(`<- ${d.t}${d.t === 'prompt' ? ' ' + d.msg.type : d.t === 'error' ? ' ' + d.text : ''}`);
      if (d.t === 'ready') setInfo(`ocgcore ${d.version.join('.')} · ${d.loadMs} ms`);
      else if (d.t === 'prompt' || d.t === 'end') play(d);
      else if (d.t === 'error') { onLog(`ERRO: ${d.text}`); setFail(d.text); }
    };
    send({ t: 'start', seed: Date.now() % SEED_RANGE, mine, foe, base: BASE, debug: debugOn });
    pong.current = Date.now();
  };

  // Diagnóstico (?debug): pinga o worker periodicamente para saber se ele está vivo.
  useEffect(() => {
    if (!debugOn) return;
    let n = 0;
    const id = window.setInterval(() => { send({ t: 'ping', n: n++ }); tick((x) => x + 1); }, PING_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    // Aquece o cache offline com a arte das cartas deste duelo.
    for (const code of new Set([...mine.main, ...mine.extra, ...foe.main, ...foe.extra])) fetch(art(code, 'small')).catch(() => {});
    start();
    return () => { stopPlayback(); worker.current?.terminate(); };
  }, []);

  const reply = (response: OcgResponse) => {
    setPrompt(null); send({ t: 'respond', response });
    rlog(`-> respond ${JSON.stringify(response)}`);
    clearDog();
    watchdog.current = window.setTimeout(() => {
      rlog(`WATCHDOG: ${WATCHDOG_MS / 1000} s sem resposta; último pong há ${Math.round((Date.now() - pong.current) / 1000)} s`);
      setFail(`O motor não respondeu (${WATCHDOG_MS / 1000} s sem novo pedido de jogada).`);
    }, WATCHDOG_MS);
  };
  const autoPass = () => send({ t: 'autoPass', value: true });
  const surrender = () => { stopPlayback(); worker.current?.terminate(); setPrompt(null); setEnded({ text: 'Você desistiu.', won: false }); };
  const restart = () => { setFail(null); setBoard(null); setPrompt(null); start(); };

  return { board, prompt, info, ended, fail, setFail, dbg, lastPongAgo: () => Math.round((Date.now() - pong.current) / 1000), reply, autoPass, surrender, restart };
}
