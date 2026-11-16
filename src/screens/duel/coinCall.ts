/**
 * O cara ou coroa do jogador (`Duel.CallCoin` dos scripts): o motor pede a escolha como um SELECT_OPTION com as
 * descrições de sistema 60 (cara) e 61 (coroa), e o lance vem logo depois como o beat `toss` do jogador (spike da
 * tarefa 3.1 do change visual-base, `proto/coin-call.ts`).
 */
import { OcgMessageType, type OcgMessage } from 'ocgcore-wasm';

export type CoinCall = 'heads' | 'tails';
const HEADS = 60n;
const TAILS = 61n;

/** As opções de um pedido de cara ou coroa, na ordem do motor; `null` se o pedido não é esse. */
export function coinCallOptions(m: OcgMessage | null): CoinCall[] | null {
  if (!m || m.type !== OcgMessageType.SELECT_OPTION) return null;
  const opts = m.options.map((o) => BigInt(o));
  if (!opts.length || !opts.every((o) => o === HEADS || o === TAILS)) return null;
  return opts.map((o) => (o === HEADS ? 'heads' : 'tails'));
}

export const coinCallLabel = (c: CoinCall) => (c === 'heads' ? 'Cara' : 'Coroa');
