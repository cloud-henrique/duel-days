/// <reference lib="webworker" />
import { createEngineHandler } from './host';
import type { FromWorker, ToWorker } from './protocol';

const post = (m: FromWorker) => postMessage(m);
self.addEventListener('error', (e) => post({ t: 'debug', text: `erro global: ${(e as ErrorEvent).message}` }));
self.addEventListener('unhandledrejection', (e) => post({ t: 'debug', text: `promise rejeitada: ${String((e as PromiseRejectionEvent).reason)}` }));
const handle = createEngineHandler(post);
onmessage = (ev: MessageEvent<ToWorker>) => { void handle(ev.data); };
