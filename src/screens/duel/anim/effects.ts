/**
 * Escolha pura do efeito de cada beat, a partir do `PACING`: que animação tocar, com que durações, quanto a fila trava
 * e que som. A regra de acessibilidade ("reduzir movimento") mora só aqui: o `play.ts` só executa o que receber.
 */
import type { Beat } from '../../../engine/protocol';
import { PACING } from './pacing';

export type Sound =
  | 'draw' | 'summon' | 'set' | 'flip' | 'activate' | 'attack' | 'damage' | 'heal' | 'destroy' | 'endTurn' | 'coin'
  | 'victory' | 'defeat';

export type EffectKind =
  /** Sem animação (o narrador e o tabuleiro seguem normalmente). */
  | 'none'
  /** Carta fantasma voando da origem ao destino. */
  | 'flight'
  /** Voo até a zona e pilar de luz. */
  | 'summon'
  /** Voo até a zona, virada para baixo (girada 90° se for monstro). */
  | 'set'
  /** Giro 3D revelando a face (e giro de 90° junto, se mudar de posição). */
  | 'reveal'
  /** Giro entre 0° e 90° na zona. */
  | 'turn'
  /** Destaque central com halo. */
  | 'splash'
  /** Pilha da corrente com o elo em resolução. */
  | 'chain'
  /** Recuo, avanço, flash no alvo e tremida. */
  | 'attack'
  /** Só o flash no alvo (ataque com "reduzir movimento"). */
  | 'flash'
  /** Popup do LP na placa. */
  | 'lp'
  /** Quebra na zona e um pedaço voando ao cemitério. */
  | 'shatter'
  /** Encolhe com fade e brilho frio. */
  | 'banish'
  /** Voo até a zona de Magia/Armadilha e pilar sobre o monstro equipado. */
  | 'equip'
  /** Moeda ou dado girando e a legenda. */
  | 'toss'
  /** Fade curto no lugar de deslocamento, giro 3D ou quebra ("reduzir movimento"). */
  | 'fade';

export interface Effect {
  kind: EffectKind;
  /** Durações das partes da animação (nomes do `PACING`), em ms a 1×. */
  durations: Record<string, number>;
  /** Trava da fila, em ms a 1×. */
  block: number;
  sound: Sound | null;
  /** Tremida da tela em px (vazia: sem tremida). */
  shake: readonly number[];
  /** Escala inicial do destaque (1: sem escala). */
  scaleFrom?: number;
}

/** Efeitos que deslocam, giram em 3D ou quebram: com "reduzir movimento" viram `fade`. */
const MOTION = new Set<EffectKind>(['flight', 'summon', 'set', 'reveal', 'shatter', 'equip', 'toss', 'banish']);

const fx = (kind: EffectKind, durations: Record<string, number>, block: number, sound: Sound | null, extra: Partial<Effect> = {}): Effect =>
  ({ kind, durations, block, sound, shake: [], ...extra });

/** O efeito de um beat sem considerar acessibilidade. */
function baseEffect(b: Beat): Effect {
  const P = PACING;
  switch (b.k) {
    case 'draw': return fx('flight', { flight: P.draw.flight }, P.draw.block, 'draw');
    case 'summon': return fx('summon', { flight: P.summon.flight, pillar: P.summon.pillar }, P.summon.block, 'summon');
    case 'set': return fx('set', { flight: P.set.flight }, P.set.block, 'set');
    case 'pos': return b.reveal
      ? fx('reveal', { flip: P.reveal.flip }, P.reveal.block, 'flip')
      : fx('turn', { turn: P.pos.turn }, P.pos.block, null);
    case 'activate': return fx('splash', { splash: P.activate.splash }, b.at.zone === 'szone' ? P.activate.block : P.activate.blockMonster, 'activate', { scaleFrom: P.activate.scaleFrom });
    case 'chainSolve': return b.of >= 2 ? fx('chain', { highlight: P.chain.highlight }, P.chain.block, null) : fx('none', {}, 0, null);
    case 'attack': return fx('attack', { lunge: P.attack.lunge }, P.attack.block, 'attack', { shake: P.attack.shake });
    case 'lp': return fx('lp', { popup: P.lp.popup }, P.lp.block, b.delta < 0 ? 'damage' : 'heal');
    case 'move':
      switch (b.why) {
        case 'destroy': return fx('shatter', { shatter: P.destroy.shatter, flight: P.destroy.flight }, P.destroy.block, 'destroy');
        case 'banish': return fx('banish', { flight: P.banish.flight }, P.banish.block, 'destroy');
        case 'hand': return fx('flight', { flight: P.move.flight }, P.move.block, 'draw');
        default: return fx('flight', { flight: P.move.flight }, P.move.block, null);
      }
    case 'equip': return fx('equip', { flight: P.equip.flight, pillar: P.equip.pillar }, P.equip.block, 'activate');
    case 'toss': return fx('toss', { spin: P.toss.spin, caption: P.toss.caption }, P.toss.block, 'coin');
    case 'turn': return fx('none', {}, P.turn.block, 'endTurn');
    case 'win': return fx('none', {}, 0, b.p === 0 ? 'victory' : 'defeat');
    case 'phase': return fx('none', {}, 0, null);
  }
}

/**
 * O efeito de um beat. Com `reducedMotion`: deslocamento, giro 3D e quebra viram um fade curto; o ataque fica só com o
 * flash no alvo; o destaque aparece sem escala; não há tremida. A ordem e os sons não mudam.
 */
export function effectFor(b: Beat, { reducedMotion = false }: { reducedMotion?: boolean } = {}): Effect {
  const e = baseEffect(b);
  if (!reducedMotion) return e;
  // A moeda perde o giro, mas a legenda com o resultado continua com tempo de leitura.
  if (e.kind === 'toss') return { ...e, kind: 'fade', durations: { fade: PACING.fade.duration, caption: PACING.toss.caption } };
  if (MOTION.has(e.kind)) return { ...e, kind: 'fade', durations: { fade: PACING.fade.duration }, block: Math.min(e.block, PACING.fade.block), shake: [] };
  if (e.kind === 'attack') return { ...e, kind: 'flash', durations: { flash: PACING.fade.duration }, block: Math.min(e.block, PACING.fade.block), shake: [] };
  if (e.kind === 'splash') return { ...e, scaleFrom: 1, shake: [] };
  return { ...e, shake: [] };
}
