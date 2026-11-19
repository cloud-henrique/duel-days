// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CardRecord } from '../../engine/session';
import type { Cards, GameData, Tier } from '../../data/cards';
import { newCampaign, type CampaignState } from '../../campaign/state';
import { DeckEditor } from './DeckEditor';

afterEach(() => { cleanup(); localStorage.clear(); });

const rec = (code: number, extra: Partial<CardRecord> = {}): CardRecord => ({
  code, alias: 0, setcodes: [], type: 0x11, level: 4, attribute: 1, race: '1', attack: 1000 + (code % 900), defense: 1000,
  lscale: 0, rscale: 0, link_marker: 0, name: `Carta ${code}`, desc: '', ...extra,
} as CardRecord);

function dataFor(s: CampaignState, more: number[] = [], fusion: number[] = []): GameData {
  const all = [...new Set([...more, ...fusion, ...Object.keys(s.collection).map(Number)])];
  const cards: Cards = Object.fromEntries(all.map((c) => [String(c), rec(c, fusion.includes(c) ? { type: 0x41, attack: 2600, name: `Fusão ${c}` } : {})]));
  const tiers: Record<string, Tier> = Object.fromEntries(all.map((c) => [String(c), 'N' as Tier]));
  return { cards, tiers, poolIds: all };
}

/** 2.000 cartas × 3 cópias = 6.000 cópias na maleta (mais o deck inicial). */
function big() {
  const s = newCampaign(1);
  const codes = Array.from({ length: 2000 }, (_, i) => 100000 + i);
  for (const c of codes) s.collection[String(c)] = 3;
  return render(<DeckEditor progress={s} data={dataFor(s, codes)} onChange={() => {}} onBack={() => {}} />);
}

describe('maleta virtualizada', () => {
  it('com 6.000 cópias, monta só dezenas de células', () => {
    const { container } = big();
    const cells = container.querySelectorAll('.trunkgrid .cell').length;
    expect(cells).toBeGreaterThan(0);
    expect(cells).toBeLessThan(80);
    expect(parseFloat((container.querySelector('.vgrid') as HTMLElement).style.paddingBottom)).toBeGreaterThan(100000);
  });

  it('buscar volta ao topo e mostra só o que bate', async () => {
    const { container } = big();
    const grid = container.querySelector('.trunkgrid') as HTMLElement;
    grid.scrollTop = 5000;
    await act(async () => { fireEvent.change(container.querySelector('.searchbox input')!, { target: { value: 'Carta 101999' } }); });
    expect(grid.scrollTop).toBe(0);
    expect(container.querySelectorAll('.trunkgrid .cell')).toHaveLength(3);
  });

  it('tocar numa carta abre o zoom', () => {
    const { container } = big();
    fireEvent.click(container.querySelector('.trunkgrid .cell')!);
    expect(document.querySelector('.cardzoom')).not.toBeNull(); // portal no <body>
  });
});

describe('editor', () => {
  it('deck inicial pronto: Main 40 e PRONTO, cópias no deck marcadas na maleta', () => {
    const s = newCampaign(5);
    const { container } = render(<DeckEditor progress={s} data={dataFor(s)} onChange={vi.fn()} onBack={vi.fn()} />);
    expect(container.querySelector('.deckhead')!.textContent).toContain('Main 40');
    expect(screen.getByText('PRONTO')).toBeTruthy();
    expect(container.querySelectorAll('.deckpanel .cell')).toHaveLength(40);
    expect(container.querySelectorAll('.trunkgrid .cell.indeck').length).toBeGreaterThan(0);
  });

  it('deck curto: "N problemas" e a lista ao tocar', () => {
    const s = newCampaign(5);
    s.decks[0].main = s.decks[0].main.slice(0, 37);
    render(<DeckEditor progress={s} data={dataFor(s)} onChange={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /problema/ }));
    expect(screen.getByText('O que falta no deck')).toBeTruthy();
    expect(screen.getByText(/Faltam 3 cartas/)).toBeTruthy();
  });

  it('Fusão vai para a seção do Extra Deck', () => {
    const s = newCampaign(5);
    s.collection['900'] = 1;
    s.decks[0].extra = [900];
    const { container } = render(<DeckEditor progress={s} data={dataFor(s, [], [900])} onChange={vi.fn()} onBack={vi.fn()} />);
    const extra = container.querySelector('.deckgroup.extra')!;
    expect(extra.textContent).toContain('Extra Deck');
    expect(extra.querySelectorAll('.cell')).toHaveLength(1);
  });

  it('zoom: tirar e pôr gravam na hora', () => {
    const s = newCampaign(5);
    const onChange = vi.fn();
    const { container } = render(<DeckEditor progress={s} data={dataFor(s)} onChange={onChange} onBack={vi.fn()} />);
    fireEvent.click(container.querySelector('.deckpanel .cell')!);
    fireEvent.click(screen.getByRole('button', { name: /Tirar do deck/ }));
    expect(onChange.mock.calls[0][0].decks[0].main).toHaveLength(39);
  });

  it('ordenar por ATK pelo diálogo', () => {
    const s = newCampaign(5);
    const { container } = render(<DeckEditor progress={s} data={dataFor(s)} onChange={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(container.querySelector('.sortbtn')!);
    fireEvent.click(screen.getByRole('button', { name: 'ATK' }));
    expect(container.querySelector('.sortbtn')!.textContent).toContain('ATK');
    expect(localStorage.getItem('duel-days.trunk.sort')).toContain('attack');
  });
});

describe('vários decks', () => {
  it('trocar o deck em uso pela folha', () => {
    const s = newCampaign(5);
    s.decks.push({ ...s.decks[0], id: 'd2', name: 'Deck 2' });
    const onChange = vi.fn();
    render(<DeckEditor progress={s} data={dataFor(s)} onChange={onChange} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Escolher o deck' }));
    fireEvent.click(screen.getByRole('button', { name: /Deck 2/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Usar este deck' }));
    expect(onChange.mock.calls.at(-1)![0].activeDeck).toBe('d2');
  });

  it('com 5 decks, "Novo deck" fica indisponível', () => {
    const s = newCampaign(5);
    for (let i = 2; i <= 5; i++) s.decks.push({ ...s.decks[0], id: `d${i}`, name: `Deck ${i}` });
    render(<DeckEditor progress={s} data={dataFor(s)} onChange={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Escolher o deck' }));
    expect((screen.getByRole('button', { name: /Novo deck/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
