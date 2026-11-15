import { makeRng } from './cpu';
import createCore, {
  OcgDuelMode, OcgLocation, OcgPosition, OcgProcessResult,
  type OcgCardData, type OcgCoreSync, type OcgDuelHandle, type OcgMessage, type OcgResponse,
} from 'ocgcore-wasm';

export interface CardRecord extends Omit<OcgCardData, 'race'> { race: string; name: string; desc: string }
export interface DeckList { main: number[]; extra: number[] }
export interface DuelAssets {
  cards: Record<string, CardRecord>;
  /** Devolve o texto Lua de um script (ou null). */
  script(name: string): string | null;
}

export interface DuelSession {
  core: OcgCoreSync;
  handle: OcgDuelHandle;
  /** Avança o motor até pedir uma resposta (ou acabar). Devolve as mensagens do trecho. */
  step(): { status: OcgProcessResult; messages: OcgMessage[] };
  respond(r: OcgResponse): void;
  destroy(): void;
}

export async function openCore() {
  return createCore({ sync: true });
}

export function startDuel(
  core: OcgCoreSync, assets: DuelAssets, decks: [DeckList, DeckList],
  opts: { seed?: bigint; flags?: bigint; log?: (t: string) => void } = {},
): DuelSession {
  const log = opts.log ?? (() => {});
  const handle = core.createDuel({
    flags: opts.flags ?? OcgDuelMode.MODE_MR1,
    seed: [opts.seed ?? 1n, 2n, 3n, 4n],
    team1: { startingLP: 8000, startingDrawCount: 5, drawCountPerTurn: 1 },
    team2: { startingLP: 8000, startingDrawCount: 5, drawCountPerTurn: 1 },
    cardReader: (code) => {
      const c = assets.cards[String(code)];
      if (!c) { log(`carta ausente: ${code}`); return null; }
      return { ...c, race: BigInt(c.race) } as OcgCardData;
    },
    scriptReader: (name) => {
      const file = name.split('/').pop()!;
      const s = assets.script(file);
      if (s == null) log(`script ausente: ${name}`);
      return s;
    },
    errorHandler: (type, text) => log(`[core ${type}] ${text}`),
  });
  if (!handle) throw new Error('falha ao criar o duelo');
  // O host precisa carregar os scripts base (como o EDOPro faz); eles carregam os proc_*.lua em cascata.
  for (const base of ['constant.lua', 'utility.lua']) {
    const src = assets.script(base);
    if (src == null) throw new Error(`script base ausente: ${base}`);
    core.loadScript(handle, base, src);
  }
  // O build do ocgcore não embaralha o deck no início (a compra sai na ordem inversa da lista): embaralhamos aqui,
  // de forma determinística pela semente (Fisher-Yates).
  const rng = makeRng(Number(opts.seed ?? 1n) * 2654435761);
  const shuffled = decks.map((d) => {
    const main = [...d.main];
    for (let i = main.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [main[i], main[j]] = [main[j], main[i]]; }
    return { ...d, main };
  }) as [DeckList, DeckList];
  for (const team of [0, 1] as const) {
    for (const [list, location] of [[shuffled[team].main, OcgLocation.DECK], [shuffled[team].extra, OcgLocation.EXTRA]] as const)
      list.forEach((code) =>
        core.duelNewCard(handle, {
          team, duelist: 0, code, controller: team, location,
          sequence: 0, position: OcgPosition.FACEDOWN_DEFENSE,
        }));
  }
  core.startDuel(handle);
  return {
    core, handle,
    step() {
      const messages: OcgMessage[] = [];
      for (let guard = 0; ; guard++) {
        if (guard > 20000) throw new Error('motor preso em laço (CONTINUE sem fim)');
        const status = core.duelProcess(handle);
        messages.push(...core.duelGetMessage(handle));
        if (status !== OcgProcessResult.CONTINUE) return { status, messages };
      }
    },
    respond: (r) => core.duelSetResponse(handle, r),
    destroy: () => core.destroyDuel(handle),
  };
}
