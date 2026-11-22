// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Cards } from '../../data/cards';
import { DeckCardPanel } from './DeckCardPanel';

const card = (code: number, name: string) => ({ code, alias: 0, setcodes: [], type: 0x11, level: 4, attribute: 1, race: '1', attack: 1300, defense: 1000, lscale: 0, rscale: 0, link_marker: 0, name, desc: 'Chamas.' });
const cards = { 5: card(5, 'Fireyarou') } as unknown as Cards;

afterEach(cleanup);

describe('painel da carta do editor (tela larga)', () => {
  it('com edição: dados, "No deck · Você tem" e os botões ligados', () => {
    const onAdd = vi.fn(), onRemove = vi.fn();
    render(<DeckCardPanel code={5} cards={cards} hover edit={{ inDeck: 1, have: 2, canAdd: true, onAdd, onRemove }} />);
    expect(document.querySelector('.cardsheet.vertical .nm')?.textContent).toBe('Fireyarou');
    expect(screen.getByText('No deck 1 · Você tem 2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Pôr no deck/ }));
    fireEvent.click(screen.getByRole('button', { name: /Tirar do deck/ }));
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('sem cópia sobrando, "Pôr" fica indisponível; sem nenhuma no deck, "Tirar" também', () => {
    render(<DeckCardPanel code={5} cards={cards} hover edit={{ inDeck: 0, have: 2, canAdd: false, onAdd: () => {}, onRemove: () => {} }} />);
    expect((screen.getByRole('button', { name: /Pôr no deck/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Tirar do deck/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('só leitura (Coleção): sem botões; sem carta, a dica', () => {
    const { container } = render(<DeckCardPanel code={5} cards={cards} hover />);
    expect(container.querySelector('.zoom-acts')).toBeNull();
    cleanup();
    expect(render(<DeckCardPanel code={null} cards={cards} hover edit={null} />).container.textContent).toMatch(/Passe o mouse.*Arraste/);
  });
});
