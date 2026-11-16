// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { GAME_ICONS, GameIcon, type GameIconName } from './icons';

afterEach(cleanup);

describe('GameIcon', () => {
  it.each(Object.keys(GAME_ICONS) as GameIconName[])('%s desenha um SVG', (name) => {
    const { container } = render(<GameIcon name={name} />);
    expect(container.querySelector('svg path, svg g')).toBeTruthy();
  });

  it('grande: degradê próprio e o ícone pintado com ele', () => {
    const { container } = render(<GameIcon name="settings" big />);
    const grad = container.querySelector('linearGradient');
    expect(grad).toBeTruthy();
    expect(container.querySelector('.game-icon.big')).toBeTruthy();
    expect(container.innerHTML).toContain(`url(#${grad!.id})`);
  });

  it('com rótulo é uma imagem com nome; sem rótulo, decorativo', () => {
    const { container, rerender } = render(<GameIcon name="close" label="Fechar" />);
    expect(container.querySelector('[aria-label="Fechar"]')?.getAttribute('role')).toBe('img');
    rerender(<GameIcon name="close" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
