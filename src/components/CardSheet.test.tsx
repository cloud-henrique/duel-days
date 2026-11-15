// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { OcgType as T } from 'ocgcore-wasm';
import type { Cards } from '../data/cards';
import { CardSheet } from './CardSheet';

const cards = {
  1: { code: 1, type: T.MONSTER | T.NORMAL, level: 4, attribute: 1, race: '1', attack: 1800, defense: 1600, name: 'Gearfried', desc: 'Texto.' },
  2: { code: 2, type: T.SPELL | T.FIELD, level: 0, attribute: 0, race: '0', attack: 0, defense: 0, name: 'Coro do Santuário', desc: 'Campo.' },
  3: { code: 3, type: T.SPELL | T.QUICKPLAY, level: 0, attribute: 0, race: '0', attack: 0, defense: 0, name: 'Tufão', desc: 'Rápida.' },
} as unknown as Cards;

afterEach(cleanup);

describe('CardSheet', () => {
  it('monstro: ícones de atributo e tipo, linha "TERRA · Guerreiro" e ATK/DEF juntos', () => {
    const { container } = render(<CardSheet code={1} cards={cards} onClose={() => {}} />);
    const icons = [...container.querySelectorAll('.kv .cardicon')].map((i) => i.getAttribute('src'));
    expect(icons).toEqual([expect.stringContaining('card-icons/attribute-earth.svg'), expect.stringContaining('card-icons/type-warrior.svg')]);
    expect(container.querySelector('.kv span')?.textContent).toBe('TERRA · Guerreiro');
    expect(container.querySelector('.atkdef')?.textContent).toBe('ATK 1800DEF 1600');
  });

  it('Magia: propriedade com o nome oficial e o ícone da propriedade', () => {
    const field = render(<CardSheet code={2} cards={cards} onClose={() => {}} />).container;
    expect(field.querySelector('.kv')?.textContent).toBe('Magia de Campo');
    expect(field.querySelector('.kv .cardicon')?.getAttribute('src')).toContain('property-field.svg');
    cleanup();
    const quick = render(<CardSheet code={3} cards={cards} onClose={() => {}} />).container;
    expect(quick.querySelector('.kv .cardicon')?.getAttribute('src')).toContain('property-quick-play.svg');
  });

  it('ícone que falta some sem quebrar a linha', () => {
    const { container } = render(<CardSheet code={1} cards={cards} onClose={() => {}} />);
    fireEvent.error(container.querySelector('.kv .cardicon')!);
    expect(container.querySelectorAll('.kv .cardicon')).toHaveLength(1);
  });

  it('o X fecha a folha', () => {
    const onClose = vi.fn();
    const { getAllByLabelText } = render(<CardSheet code={1} cards={cards} onClose={onClose} />);
    fireEvent.click(getAllByLabelText('Fechar').find((b) => b.classList.contains('close'))!);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
