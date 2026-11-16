// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Intro, introTimeline, wantsIntro } from './Intro';
import { OUTRO_TITLE, Outro } from './Outro';

afterEach(() => { cleanup(); vi.useRealTimers(); });
const me = { id: 'npc_duelists_dm__hailey', name: 'Ana' }, foe = { id: 'joey_wheeler', name: 'Joey' };

describe('Intro', () => {
  it('o toque pula a abertura e chama onDone uma vez só', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<Intro me={me} foe={foe} starter={0} reduced={false} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pular abertura' }));
    expect(onDone).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(10_000);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('sem toque, termina sozinha em ~3s e diz quem começa', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<Intro me={me} foe={foe} starter={1} reduced={false} onDone={onDone} />);
    expect(screen.getByText('Joey começa')).toBeTruthy();
    const { end } = introTimeline(false);
    expect(end).toBeGreaterThan(2500);
    expect(end).toBeLessThan(3500);
    vi.advanceTimersByTime(end - 1);
    expect(onDone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('com animações desligadas não aparece; com "reduzir movimento" é mais curta', () => {
    expect(wantsIntro('off')).toBe(false);
    expect(wantsIntro('normal')).toBe(true);
    expect(wantsIntro('fast')).toBe(true);
    expect(introTimeline(true).end).toBeLessThan(introTimeline(false).end);
  });
});

describe('Outro', () => {
  it.each([['win', 'VITÓRIA!'], ['loss', 'DERROTA'], ['draw', 'EMPATE']] as const)('%s: título %s', (result, title) => {
    render(<Outro result={result} detail="x" me={me} foe={foe} coins={30} reduced={false} onContinue={() => {}} />);
    expect(screen.getByRole('heading').textContent).toBe(title);
    expect(OUTRO_TITLE[result]).toBe(title);
  });

  it('vencedor em destaque e perdedor esmaecido; Continuar sai', () => {
    const onContinue = vi.fn();
    const { container } = render(<Outro result="win" detail="Você venceu!" me={me} foe={foe} coins={100} reduced onContinue={onContinue} />);
    expect(container.querySelector('figure.won figcaption')?.textContent).toBe('Ana');
    expect(container.querySelector('figure.lost figcaption')?.textContent).toBe('Joey');
    expect(container.querySelector('[aria-label="+100 DP"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
