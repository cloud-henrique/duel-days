import { useEffect, useRef, useState } from 'react';
import type { OcgMessage, OcgResponse } from 'ocgcore-wasm';
import type { Board, FromWorker, Step, ToWorker } from '../../engine/protocol';
import type { DeckList } from '../../engine/session';
import type { CpuKind } from '../../engine/search';
import { InlineEngine } from '../../engine/inline';
import { debugOn, engineInline, rlog } from '../../debug/remote';
import { art } from '../../components/CardSheet';
import type { StageIO } from './anim/useBeatQueue';

const BASE = import.meta.env.BASE_URL;
/** Sem resposta do motor por este tempo depois de uma jogada, a tela mostra o erro em vez de ficar parada. */
const WATCHDOG_MS = 12_000;
/** No modo diagnóstico, intervalo do ping ao Worker. */
const PING_MS = 2_000;
/** A semente do duelo vem do relógio, limitada a este valor. */
const SEED_RANGE = 100_000;
const DEBUG_LINES = 15;

/** Fim do duelo: `result` escolhe o título; `won` decide o DP (empate e desistência contam como derrota). */
export interface DuelEnd { text: string; won: boolean; result: 'win' | 'loss' | 'draw'; surrendered?: boolean }

/**
 * Ciclo de vida do motor (Worker ou thread principal): inicia o duelo, recebe tabuleiro/prompt/eventos,
 * envia respostas e vigia travamentos.
 */
export function useDuelEngine({ mine, foe, foeName, cpu, autoPass = false, stage, cancelStage, onPrompt, onStep, onNotice, onLog }: {
  mine: DeckList; foe: DeckList; foeName: string;
  /** Perfil da CPU (chefe do tier ou comum). */
  cpu?: CpuKind;
  /** Passa sozinho nas correntes opcionais do jogador (ajuste "Correntes"); muda no meio do duelo também. */
  autoPass?: boolean;
  /** Encena os steps (a fila de animação); `false` se foi cancelada. */
  stage: (steps: Step[], io: StageIO) => Promise<boolean>;
  cancelStage: () => void;
  /** Chamado a cada novo pedido de jogada (antes de mostrar o prompt). */
  onPrompt: () => void;
  /** Cada acontecimento do motor, na ordem em que a tela o toca (o tabuleiro dele já aplicado). */
  onStep: (step: Step) => void;
  /** Aviso para o narrador (ex.: jogada inválida). */
  onNotice: (text: string) => void;
  /** Linha só para o histórico (ex.: erro do motor). */
  onLog: (line: string) => void;
}) {
  const worker = useRef<Worker | InlineEngine | null>(null);
  const autoPassRef = useRef(autoPass);
  autoPassRef.current = autoPass;
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
  /** Vigia: mede o silêncio do motor (cada parte de steps, enviada antes de cada decisão da CPU, rearma). */
  const armDog = () => {
    clearDog();
    watchdog.current = window.setTimeout(() => {
      rlog(`WATCHDOG: ${WATCHDOG_MS / 1000} s sem resposta; último pong há ${Math.round((Date.now() - pong.current) / 1000)} s`);
      setFail(`O motor não respondeu (${WATCHDOG_MS / 1000} s sem novo pedido de jogada).`);
    }, WATCHDOG_MS);
  };
  const send = (m: ToWorker) => worker.current?.postMessage(m);

  // Encenação: os steps do motor passam pela fila de animação; o pedido de jogada (ou o fim) só aparece depois dela.
  // As partes chegam enquanto a CPU pensa: cada uma entra na fila depois da anterior (a fila de animação aborta a
  // encenação em curso se chamada de novo). `gen` descarta o que sobrou de um duelo reiniciado.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const gen = useRef(0);
  const stopPlayback = () => { gen.current++; queue.current = Promise.resolve(); cancelStage(); };
  const enqueue = (steps: Step[], then?: () => void) => {
    const g = gen.current;
    queue.current = queue.current.then(async () => {
      if (g !== gen.current) return;
      const done = await stage(steps, { announce: onStep, apply: setBoard });
      if (done && g === gen.current) then?.();
    });
  };
  const finish = (d: Extract<FromWorker, { t: 'prompt' | 'end' }>) => {
    setBoard(d.board);
    if (d.t === 'prompt') { setPrompt(d.msg); onPrompt(); if (d.notice) onNotice(d.notice); return; }
    setPrompt(null);
    // O motor indica empate com um vencedor que não é nenhum dos dois jogadores.
    const result = d.winner === 0 ? 'win' : d.winner === 1 ? 'loss' : 'draw';
    setEnded({ text: result === 'win' ? 'Você venceu!' : result === 'loss' ? `${foeName} venceu.` : 'Empate.', won: result === 'win', result });
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
      if (d.t === 'steps') { armDog(); if (d.steps.length) enqueue(d.steps); return; }
      clearDog();
      if (d.t !== 'ready') rlog(`<- ${d.t}${d.t === 'prompt' ? ' ' + d.msg.type : d.t === 'error' ? ' ' + d.text : ''}`);
      if (d.t === 'ready') setInfo(`ocgcore ${d.version.join('.')} · ${d.loadMs} ms`);
      else if (d.t === 'prompt' || d.t === 'end') enqueue(d.steps, () => finish(d));
      else if (d.t === 'error') { onLog(`ERRO: ${d.text}`); setFail(d.text); }
    };
    send({ t: 'start', seed: Date.now() % SEED_RANGE, mine, foe, base: BASE, debug: debugOn, cpu, autoPass: autoPassRef.current });
    pong.current = Date.now();
  };

  // Diagnóstico (?debug): pinga o worker periodicamente para saber se ele está vivo.
  useEffect(() => {
    if (!debugOn) return;
    let n = 0;
    const id = window.setInterval(() => { send({ t: 'ping', n: n++ }); tick((x) => x + 1); }, PING_MS);
    return () => window.clearInterval(id);
  }, []);

  // Arte das cartas deste duelo já baixada e decodificada: a carta comprada aparece inteira, sem a ilustração chegar
  // depois. É a variante que a face da carta usa (`thumb`); as imagens ficam referenciadas até o fim do duelo para o
  // navegador não descartar a versão decodificada. O service worker guarda os arquivos para os próximos duelos.
  const warmArt = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    warmArt.current = [...new Set([...mine.main, ...mine.extra, ...foe.main, ...foe.extra])].map((code) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = art(code, 'thumb');
      img.decode().catch(() => {});
      return img;
    });
    start();
    return () => { stopPlayback(); worker.current?.terminate(); warmArt.current = []; };
  }, []);

  const reply = (response: OcgResponse) => {
    setPrompt(null); send({ t: 'respond', response });
    rlog(`-> respond ${JSON.stringify(response)}`);
    armDog();
  };
  useEffect(() => { send({ t: 'autoPass', value: autoPass }); }, [autoPass]); // eslint-disable-line react-hooks/exhaustive-deps
  const surrender = () => { stopPlayback(); worker.current?.terminate(); setPrompt(null); setEnded({ text: 'Você desistiu.', won: false, result: 'loss', surrendered: true }); };
  const restart = () => { setFail(null); setBoard(null); setPrompt(null); start(); };

  return { board, prompt, info, ended, fail, setFail, dbg, lastPongAgo: () => Math.round((Date.now() - pong.current) / 1000), reply, surrender, restart };
}
