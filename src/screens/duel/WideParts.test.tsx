// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { Cards } from '../../data/cards';
import { CardPanel, RecentLog } from './WideParts';

const card = (code: number, name: string) => ({ code, alias: 0, setcodes: [], type: 0x11, level: 4, attribute: 1, race: '1', attack: 1200, defense: 800, lscale: 0, rscale: 0, link_marker: 0, name, desc: 'Um lobo.' });
const cards = { 7: card(7, 'O Presa de Prata') } as unknown as Cards;

afterEach(cleanup);

describe('painel da carta (tela larga)', () => {
  it('sem carta, a dica; com mouse fala em passar o mouse', () => {
    const { container } = render(<CardPanel code={null} cards={cards} notes={[]} hover />);
    expect(container.querySelector('.cardpanel.empty')?.textContent).toMatch(/Passe o mouse/);
  });

  it('com carta, os detalhes inteiros e as ligações, sem véu', () => {
    const { container } = render(<CardPanel code={7} cards={cards} notes={['Equipado com Espada']} hover />);
    expect(container.querySelector('.cardsheet.vertical .nm')?.textContent).toBe('O Presa de Prata');
    expect(container.querySelector('.desc')?.textContent).toBe('Um lobo.');
    expect(container.querySelector('.sheetnotes')?.textContent).toBe('Equipado com Espada');
    expect(container.querySelector('.backdrop, .scrim')).toBeNull();
  });

  it('com um pedido aberto, a faixa compacta (nome e ATK/DEF); sem carta, nada', () => {
    const { container } = render(<CardPanel code={7} cards={cards} notes={[]} compact hover />);
    expect(container.querySelector('.cardpanel.compact')?.textContent).toMatch(/O Presa de Prata.*ATK 1200.*DEF 800/);
    cleanup();
    expect(render(<CardPanel code={null} cards={cards} notes={[]} compact hover />).container.innerHTML).toBe('');
  });
});

describe('histórico recente', () => {
  it('mostra as últimas linhas, a mais nova por último, e abre o histórico todo', () => {
    const onOpen = vi.fn();
    const log = Array.from({ length: 20 }, (_, i) => `linha ${i}`);
    const { getByRole } = render(<RecentLog log={log} onOpen={onOpen} />);
    const btn = getByRole('button', { name: 'Histórico' });
    const lines = [...btn.querySelectorAll('span')].map((s) => s.textContent);
    expect(lines).toHaveLength(12);
    expect(lines.at(-1)).toBe('linha 19');
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
