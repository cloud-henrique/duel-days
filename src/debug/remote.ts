// Logs do aparelho enviados ao servidor de preview (só com ?debug na URL). O servidor grava em /tmp/duel-days-device.log.
const BASE = import.meta.env.BASE_URL;
export const debugOn = typeof location !== 'undefined' && location.search.includes('debug');
export const engineInline = typeof location !== 'undefined' && location.search.includes('engine=inline');
let queue: string[] = [];
let timer: number | undefined;
const t0 = Date.now();

export function rlog(text: string) {
  if (!debugOn) return;
  queue.push(`${((Date.now() - t0) / 1000).toFixed(3)} ${text}`);
  if (timer === undefined) timer = window.setTimeout(flush, 400);
}

function flush() {
  timer = undefined;
  const body = queue.join('\n');
  queue = [];
  if (body) fetch(`${BASE}__log`, { method: 'POST', body, keepalive: true }).catch(() => {});
}

if (debugOn && typeof window !== 'undefined') {
  rlog(`=== sessão ${new Date().toISOString()} | ${navigator.userAgent} | ${location.search}`);
  window.addEventListener('error', (e) => rlog(`[página] erro: ${e.message} @ ${e.filename}:${e.lineno}`));
  window.addEventListener('unhandledrejection', (e) => rlog(`[página] promise rejeitada: ${String(e.reason)}`));
}
