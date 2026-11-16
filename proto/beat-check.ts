// Validação dos beats contra o motor real (change `animar-duelo`, tarefa 1.5), usada pelo monkey.ts e pelo smoke.ts.
import type { Beat, Board, Loc, Step } from '../src/engine/protocol';
import { effectFor } from '../src/screens/duel/anim/effects';
import { PACING } from '../src/screens/duel/anim/pacing';

/** Limites de sequência por zona no modo MR1 (5 zonas de monstro; 5 de Magia/Armadilha + campo na 5). */
const MAX_SEQ: Partial<Record<Loc['zone'], number>> = { mzone: 4, szone: 5 };

/** Lugares de um beat, com a indicação de quais podem ser `none` (ficha criada ou que sai do jogo). */
function locsOf(b: Beat): [Loc, boolean][] {
  switch (b.k) {
    case 'summon': return [[b.from, true], [b.to, false]];
    case 'set': return [[b.from, false], [b.to, false]];
    case 'move': return [[b.from, true], [b.to, true]];
    case 'pos': return [[b.at, false]];
    case 'activate': return [[b.at, false]];
    case 'attack': return b.to ? [[b.from, false], [b.to, false]] : [[b.from, false]];
    case 'equip': return [[b.from, false], [b.to, false], [b.target, false]];
    default: return [];
  }
}

/** Problemas de localização nos beats (lista vazia: tudo certo). */
export function checkLocs(steps: Step[]): string[] {
  const out: string[] = [];
  for (const { beat } of steps) {
    for (const [l, noneOk] of locsOf(beat)) {
      const max = MAX_SEQ[l.zone];
      if ((l.zone === 'none' && !noneOk) || l.seq < 0 || (max != null && l.seq > max) || (l.p !== 0 && l.p !== 1))
        out.push(`${beat.k}: lugar inválido ${JSON.stringify(l)}`);
    }
  }
  return out;
}

/** O tabuleiro sem ATK/DEF: efeitos contínuos recalculam os valores em passos do motor que não geram beat. */
const layout = (b: Board) => JSON.stringify(b, (k, v) => (k === 'attack' || k === 'defense' ? undefined : v));

/**
 * O último retrato dos steps tem a mesma disposição do tabuleiro final (cartas, posições, LP, contagens). Cada passo do
 * motor fecha com um retrato no último beat dele; um passo seguinte sem beats só pode mudar ATK/DEF (efeito contínuo),
 * e a tela aplica o tabuleiro final no fim de qualquer forma. `null`: a mensagem não tem retrato para comparar.
 */
export function lastBoardMatches(steps: Step[], final: Board): boolean | null {
  const last = [...steps].reverse().find((s) => s.board)?.board;
  return last ? layout(last) === layout(final) : null;
}

/** Acima disto, um turno fica longo demais para assistir na velocidade normal (`design.md`, riscos). */
export const LONG_TURN_MS = 15_000;

/**
 * Soma as travas da fila na velocidade normal, por turno: a de cada beat (`effectFor`) mais a de "pensar" da CPU.
 * Beats `together` tocam junto com o anterior e não somam. Devolve um acumulador que recebe os steps em ordem.
 */
export function turnTimer() {
  let ms = 0, turn = 0, count = 0;
  const long: { turn: number; ms: number }[] = [];
  const close = () => { if (turn) count++; if (ms > LONG_TURN_MS) long.push({ turn, ms }); ms = 0; };
  return {
    add(steps: Step[]) {
      for (const s of steps) {
        if (s.beat.k === 'turn') { close(); turn = s.beat.n; }
        if (s.think) ms += PACING.think.block;
        if (!s.together) ms += effectFor(s.beat).block;
      }
    },
    /** Fecha o último turno e devolve os longos. */
    end() { close(); return long; },
    /** Turnos fechados até aqui. */
    get count() { return count; },
  };
}
