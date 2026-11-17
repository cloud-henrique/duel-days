// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { OcgType as T } from 'ocgcore-wasm';
import type { CardRecord } from '../engine/session';
import { CardFace, nameFontSize } from './CardFace';

const card = (over: Partial<CardRecord>): CardRecord => ({
  code: 1, alias: 0, setcodes: [], type: T.MONSTER | T.NORMAL, level: 4, attribute: 16, race: '1', attack: 2000, defense: 1500,
  lscale: 0, rscale: 0, link_marker: 0, name: 'Guerreiro', desc: 'Texto.', ...over,
} as CardRecord);

afterEach(cleanup);

describe('CardFace', () => {
  it('monstro: nome em PT, estrelas, moldura e tarja ATK / DEF', () => {
    const { container } = render(<CardFace code={1} card={card({ name: 'Mago Negro', level: 7 })} />);
    expect(container.querySelector('.cf-name span')?.textContent).toBe('Mago Negro');
    expect(container.querySelectorAll('.cf-level i')).toHaveLength(7);
    expect(container.querySelector('.cardface')?.className).toContain('cf-normal');
    expect(container.querySelector('.cf-text .cf-stats')?.textContent).toBe('2000 / 1500');
  });

  it('Magia e Armadilha: tarja com MAGIA / ARMADILHA e selo próprio', () => {
    const spell = render(<CardFace code={2} card={card({ type: T.SPELL })} />).container;
    expect(spell.querySelector('.cf-text .cf-kind')?.textContent).toBe('MAGIA');
    expect(spell.querySelector('img.cf-attr')?.getAttribute('src')).toContain('card-icons/card-spell.svg');
    // Sem o ícone oficial (não versionado), o selo desenhado com o kanji.
    fireEvent.error(spell.querySelector('img.cf-attr')!);
    expect(spell.querySelector('.cf-attr')?.textContent).toBe('魔');
    cleanup();
    const trap = render(<CardFace code={3} card={card({ type: T.TRAP })} />).container;
    expect(trap.querySelector('.cf-text .cf-kind')?.textContent).toBe('ARMADILHA');
    expect(trap.querySelector('.cardface')?.className).toContain('cf-trap');
  });

  it('ATK "?" aparece como ?', () => {
    const { container } = render(<CardFace code={4} card={card({ attack: -2 })} />);
    expect(container.querySelector('.cf-text .cf-stats')?.textContent).toBe('? / 1500');
  });

  it('compacta usa a miniatura; full usa a arte grande', () => {
    expect(render(<CardFace code={5} card={card({})} />).container.querySelector('.cf-art img')?.getAttribute('src')).toContain('cards/thumb/5.webp');
    cleanup();
    expect(render(<CardFace code={5} card={card({})} detail="full" />).container.querySelector('.cf-art img')?.getAttribute('src')).toContain('cards/full/5.webp');
  });

  it('sem a arte, mostra o preenchimento (sem imagem quebrada) e tenta de novo quando a rede volta', () => {
    const { container } = render(<CardFace code={5} card={card({})} />);
    fireEvent.error(container.querySelector('.cf-art img')!);
    expect(container.querySelector('.cf-art img')).toBeNull();
    expect(container.querySelector('.cf-art')?.className).toContain('empty');
    expect(container.querySelector('.cf-name span')?.textContent).toBe(card({}).name);
    act(() => { window.dispatchEvent(new Event('online')); });
    expect(container.querySelector('.cf-art img')?.getAttribute('src')).toContain('cards/thumb/5.webp');
  });

  it('versão full mostra tipo, texto e ATK/DEF', () => {
    const { container } = render(<CardFace code={6} card={card({ desc: 'Um mago.' })} detail="full" />);
    expect(container.querySelector('.cf-text p')?.textContent).toBe('Um mago.');
    expect(container.querySelector('.cf-text small')?.textContent).toBe('ATK/2000 DEF/1500');
  });
});

describe('nameFontSize', () => {
  it('nomes curtos usam o tamanho máximo; longos encolhem até o mínimo', () => {
    expect(nameFontSize('Kuriboh')).toBe(24);
    expect(nameFontSize('Dragão Branco de Olhos Azuis')).toBeLessThan(24);
    expect(nameFontSize('x'.repeat(80))).toBe(12);
  });
});
