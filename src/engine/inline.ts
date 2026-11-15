import { createEngineHandler } from './host';
import type { FromWorker, ToWorker } from './protocol';

/** Imita a interface de um Worker, rodando o motor na thread principal (contorna problemas de Worker no iOS). */
export class InlineEngine {
  onmessage: ((ev: MessageEvent<FromWorker>) => void) | null = null;
  onerror: ((ev: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  private alive = true;
  private handle = createEngineHandler((m) => { if (this.alive) setTimeout(() => this.onmessage?.({ data: m } as MessageEvent<FromWorker>), 0); });
  postMessage(m: ToWorker) { setTimeout(() => { if (this.alive) void this.handle(m); }, 0); }
  terminate() { this.alive = false; }
}
