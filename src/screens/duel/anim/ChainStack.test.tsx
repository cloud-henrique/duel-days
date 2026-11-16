// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ChainStack, NO_CHAIN, nextChain, type ChainState } from './ChainStack';
import type { Beat } from '../../../engine/protocol';

afterEach(cleanup);
const links: ChainState['links'] = [{ code: 1, p: 1 }, { code: 2, p: 0, mark: 'negated' }, { code: 3, p: 1, mark: 'disabled' }];
const link = (c: HTMLElement, n: number) => c.querySelector(`[data-link="${n}"]`)!;

describe('ChainStack', () => {
  it('marca o elo em resolução, o negado e o anulado', () => {
    const { container } = render(<ChainStack chain={{ links, current: 1 }} cards={{}} />);
    expect(link(container, 1).className).toContain('now');
    expect(link(container, 2).className).toContain('negated');
    expect(link(container, 2).querySelector('.strike')).toBeTruthy();
    expect(link(container, 3).className).toContain('disabled');
    expect(link(container, 3).textContent).toContain('sem efeito');
    expect(link(container, 2).className).not.toContain('now');
  });

  it('o último elo fica no topo (resolve primeiro)', () => {
    const { container } = render(<ChainStack chain={{ links, current: 3 }} cards={{}} />);
    expect([...container.querySelectorAll('[data-link]')].map((e) => e.getAttribute('data-link'))).toEqual(['3', '2', '1']);
  });

  it('não aparece com 1 elo nem fora da resolução', () => {
    expect(render(<ChainStack chain={{ links: links.slice(0, 1), current: 1 }} cards={{}} />).container.innerHTML).toBe('');
    cleanup();
    expect(render(<ChainStack chain={{ links, current: null }} cards={{}} />).container.innerHTML).toBe('');
  });
});

describe('nextChain', () => {
  const act = (code: number, p: 0 | 1): Beat => ({ k: 'activate', at: { p, zone: 'szone', seq: 0 }, code, p });
  const solve = (link: number, result: 'ok' | 'negated' | 'disabled' = 'ok'): Beat => ({ k: 'chainSolve', link, of: 2, result });
  const run = (...bs: Beat[]) => bs.reduce(nextChain, NO_CHAIN);

  it('ativações viram elos; a resolução marca o elo atual', () => {
    expect(run(act(1, 1), act(2, 0), solve(2))).toEqual({ links: [{ code: 1, p: 1 }, { code: 2, p: 0 }], current: 2 });
  });

  it('negação e anulação ficam marcadas no elo', () => {
    const c = run(act(1, 1), act(2, 0), solve(2), solve(1, 'negated'), solve(1));
    expect(c.links[0].mark).toBe('negated');
    expect(c.current).toBe(1);
    expect(run(act(1, 1), act(2, 0), solve(1, 'disabled')).links[0].mark).toBe('disabled');
  });

  it('ativação depois de a resolução começar abre corrente nova; o turno limpa', () => {
    expect(run(act(1, 1), act(2, 0), solve(2), solve(1), act(3, 1)).links).toEqual([{ code: 3, p: 1 }]);
    expect(run(act(1, 1), { k: 'turn', p: 0, n: 2 })).toEqual(NO_CHAIN);
  });
});
