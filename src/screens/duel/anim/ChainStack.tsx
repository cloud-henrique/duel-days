import type { Beat } from '../../../engine/protocol';
import type { Cards } from '../../../data/cards';
import { CardFace } from '../../../components/CardFace';

export interface ChainLink { code: number; p: number; mark?: 'negated' | 'disabled' }
export interface ChainState { links: ChainLink[]; current: number | null }
export const NO_CHAIN: ChainState = { links: [], current: null };

/**
 * A pilha depois de um beat: cada ativação é um elo (uma ativação depois de a resolução ter começado abre corrente
 * nova); a resolução marca o elo atual e guarda negação/anulação; o turno novo limpa.
 */
export function nextChain(c: ChainState, b: Beat): ChainState {
  switch (b.k) {
    case 'activate': return { links: [...(c.current == null ? c.links : []), { code: b.code, p: b.p }], current: null };
    case 'chainSolve': {
      const links = c.links.map((l, i) => (i === b.link - 1 && b.result !== 'ok' ? { ...l, mark: b.result } : l));
      return { links, current: b.link };
    }
    case 'turn': return NO_CHAIN;
    default: return c;
  }
}

/**
 * Pilha da corrente (só com 2 ou mais elos), à esquerda: elo 1 embaixo. O elo que está resolvendo cresce com contorno
 * amarelo; um elo negado fica riscado em vermelho; um elo anulado mostra "sem efeito".
 */
export function ChainStack({ chain, cards }: { chain: ChainState; cards: Cards }) {
  if (chain.links.length < 2 || chain.current == null) return null;
  return (
    <ol className="chainstack" aria-label="Corrente">
      {chain.links.map((l, i) => {
        const n = i + 1;
        const cls = ['link', n === chain.current ? 'now' : '', l.mark ?? ''].filter(Boolean).join(' ');
        return (
          <li key={i} className={cls} data-link={n}>
            <div className="linkcard"><CardFace code={l.code} card={cards[String(l.code)]} /></div>
            <b className="num">{n}</b>
            {l.mark === 'negated' && <i className="strike" aria-label="negado" />}
            {l.mark === 'disabled' && <em>sem efeito</em>}
          </li>
        );
      }).reverse()}
    </ol>
  );
}
