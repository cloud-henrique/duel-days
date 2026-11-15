import { DuelDriver } from './driver';
import { openCore, type CardRecord } from './session';
import type { FromWorker, ToWorker } from './protocol';

// Estado em globalThis (não em variável do módulo): se o navegador reexecutar o módulo, o duelo continua acessível.
const G = globalThis as unknown as { __duel?: DuelDriver | null };
const getDriver = () => G.__duel ?? null;

async function loadAssets(base: string) {
  const cards: Record<string, CardRecord> = await (await fetch(`${base}data/cards.json`)).json();
  try {
    const pt: Record<string, { name: string }> = await (await fetch(`${base}data/text.pt.json`)).json();
    for (const [id, t] of Object.entries(pt)) if (cards[id]) cards[id].name = t.name;
  } catch { /* sem tradução */ }
  const bundle: Record<string, string> = await (await fetch(`${base}scripts.json`)).json();
  return { cards, scripts: new Map<string, string>(Object.entries(bundle)) };
}

/** Trata as mensagens do duelo. O mesmo código roda dentro do Worker ou na thread principal (?engine=inline). */
export function createEngineHandler(post: (m: FromWorker) => void) {
  let debug = false;
  const dbg = (text: string) => post({ t: 'debug', text });

  return async (d: ToWorker) => {
    if (d.t === 'ping') { post({ t: 'pong', n: d.n }); return; }
    if (debug || d.t === 'start') debug = d.t === 'start' ? !!d.debug : debug;
    if (debug) dbg(`recebido ${d.t}${d.t === 'respond' ? ' ' + JSON.stringify(d.response) : ''} | duelo=${getDriver() ? 'sim' : 'NÃO'}`);
    try {
      if (d.t === 'start') {
        const t0 = performance.now();
        getDriver()?.session.destroy();
        const { cards, scripts } = await loadAssets(d.base);
        if (debug) dbg(`dados carregados (${Math.round(performance.now() - t0)} ms)`);
        const core = await openCore();
        if (debug) dbg(`motor criado (${Math.round(performance.now() - t0)} ms)`);
        const driver = new DuelDriver(core, cards, (n) => scripts.get(n) ?? null, d.mine, d.foe, d.seed);
        G.__duel = driver;
        if (debug) driver.trace = dbg;
        if (debug) dbg(`duelo criado, seed ${d.seed} (${Math.round(performance.now() - t0)} ms)`);
        post({ t: 'ready', version: core.getVersion() as [number, number], loadMs: Math.round(performance.now() - t0) });
        const t1 = performance.now();
        const out = driver.run();
        if (debug) dbg(`primeiro processamento: ${out.t} em ${Math.round(performance.now() - t1)} ms`);
        post(out);
      } else if (d.t === 'autoPass') {
        const driver = getDriver();
        if (driver) driver.autoPass = d.value;
      } else if (d.t === 'respond') {
        const driver = getDriver();
        if (!driver) { post({ t: 'error', text: 'O worker perdeu o estado do duelo (reinicie o duelo).' }); return; }
        const t0 = performance.now();
        const out = driver.respond(d.response);
        if (debug) dbg(`motor respondeu ${out.t} em ${Math.round(performance.now() - t0)} ms`);
        post(out);
      }
    } catch (e) {
      if (debug) dbg(`exceção: ${String((e as Error)?.message ?? e)}`);
      post({ t: 'error', text: String((e as Error)?.stack ?? e) });
    }
  }
}
