// Ajudantes dos testes do motor (Node): carregar cartas e scripts gerados e montar quebra-cabeças.
// Os arquivos de `public/` são gerados e ficam fora do git: sem eles, os testes que usam o motor são pulados.
import { existsSync, readFileSync } from 'node:fs';
import { OcgLocation, OcgMessageType, OcgPosition, OcgResponseType, SelectBattleCMDAction, SelectIdleCMDAction, type OcgMessage, type OcgResponse } from 'ocgcore-wasm';
import { DuelDriver, type DriverOut } from '../driver';
import { openCore, type CardRecord, type DeckList, type PlacedCard } from '../session';
import type { Beat } from '../protocol';

export const HAS_ENGINE_DATA = existsSync('public/data/cards.json') && existsSync('public/scripts.json');

let cache: { cards: Record<string, CardRecord>; scripts: Record<string, string> } | null = null;
export function engineData() {
  cache ??= {
    cards: JSON.parse(readFileSync('public/data/cards.json', 'utf8')),
    scripts: JSON.parse(readFileSync('public/scripts.json', 'utf8')),
  };
  return cache;
}

export const C = {
  mokey: 27288416,
  tyhone: 72842870,
  metalmorph: 68540058,
  mirrorForce: 44095762,
  raigeki: 12580477,
  manEater: 54652250,
};

/** Monstros de teste por ATK (Normais, nível ≤4), para montar campos. */
export function normalWithAtk(atk: number, def?: number): number {
  const { cards } = engineData();
  const hit = Object.values(cards).find((c) => c.type === 17 && c.level <= 4 && c.attack === atk && (def == null || c.defense === def));
  if (!hit) throw new Error(`sem Normal com ATK ${atk}`);
  return hit.code;
}

/** Atalhos para cartas colocadas. */
export const mon = (p: 0 | 1, code: number, seq = 0, position: OcgPosition = OcgPosition.FACEUP_ATTACK): PlacedCard => ({ p, code, location: OcgLocation.MZONE, seq, position });
export const st = (p: 0 | 1, code: number, seq = 0, position: OcgPosition = OcgPosition.FACEDOWN_DEFENSE): PlacedCard => ({ p, code, location: OcgLocation.SZONE, seq, position });
export const hand = (p: 0 | 1, code: number): PlacedCard => ({ p, code, location: OcgLocation.HAND });

/** Um deck só de Mokey Mokey (300 ATK): compra que não muda a decisão. */
const filler = (): DeckList => ({ main: Array(40).fill(C.mokey), extra: [] });

/** Como o jogador "passa" num quebra-cabeça: termina o turno, não responde, diz não. */
function passFor(m: OcgMessage): OcgResponse {
  switch (m.type) {
    case OcgMessageType.SELECT_IDLECMD:
      return { type: OcgResponseType.SELECT_IDLECMD, action: m.to_ep ? SelectIdleCMDAction.TO_EP : SelectIdleCMDAction.TO_BP, index: null };
    case OcgMessageType.SELECT_BATTLECMD: return { type: OcgResponseType.SELECT_BATTLECMD, action: m.to_ep ? SelectBattleCMDAction.TO_EP : SelectBattleCMDAction.TO_M2, index: null };
    case OcgMessageType.SELECT_CHAIN: return { type: OcgResponseType.SELECT_CHAIN, index: m.forced ? 0 : null };
    case OcgMessageType.SELECT_EFFECTYN: return { type: OcgResponseType.SELECT_EFFECTYN, yes: false };
    case OcgMessageType.SELECT_YESNO: return { type: OcgResponseType.SELECT_YESNO, yes: false };
    default: throw new Error(`quebra-cabeça: prompt inesperado do jogador ${OcgMessageType[m.type]}`);
  }
}

export interface PuzzleResult {
  /** Beats do turno da CPU. */
  beats: Beat[];
  /** Todos os beats (a CPU também responde no turno do jogador). */
  all: Beat[];
  out: Extract<DriverOut, { t: 'prompt' | 'end' }>;
  driver: DuelDriver;
}

/**
 * Quebra-cabeça: o jogador (0) passa o turno 1 sem fazer nada e a CPU (1) joga o turno 2 com as cartas colocadas.
 * Devolve os beats do turno da CPU (até o jogador poder agir de novo no turno 3, ou o fim do duelo).
 * `respond0` responde os prompts do jogador no turno da CPU (padrão: passar).
 */
export async function puzzle(placed: PlacedCard[], o: {
  cpu?: 'comum' | 'chefe'; lp?: [number, number]; seed?: number; maxSims?: number; respond0?: (m: OcgMessage) => OcgResponse;
} = {}): Promise<PuzzleResult> {
  const { cards, scripts } = engineData();
  const core = await openCore();
  const driver = new DuelDriver(core, cards, (n) => scripts[n] ?? null, filler(), filler(), o.seed ?? 1, undefined, {
    cpu: o.cpu ?? 'comum', placed, startingDraw: 0, lp: o.lp, budget: { maxMs: Infinity, maxSims: o.maxSims ?? 64 },
  });
  let out = driver.run();
  const beats: Beat[] = [];
  const all: Beat[] = [];
  let cpuTurn = false;
  for (let guard = 0; guard < 200; guard++) {
    if (out.t !== 'prompt' && out.t !== 'end') throw new Error(out.t === 'error' ? out.text : out.t);
    for (const s of out.steps) {
      if (s.beat.k === 'turn') cpuTurn = s.beat.p === 1;
      if (cpuTurn) beats.push(s.beat);
      all.push(s.beat);
    }
    if (out.t === 'end') return { beats, all, out, driver };
    const m = out.msg;
    // Turno 3 do jogador: a CPU já jogou.
    if (!cpuTurn && beats.length) return { beats, all, out, driver };
    out = driver.respond(cpuTurn && o.respond0 ? o.respond0(m) : passFor(m));
  }
  throw new Error('quebra-cabeça não terminou');
}
