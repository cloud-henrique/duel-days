// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CardRecord } from '../../engine/session';
import type { Cards, GameData, Tier } from '../../data/cards';
import { newCampaign, type CampaignState } from '../../campaign/state';
import { DeckEditor } from './DeckEditor';

// O happy-dom simula 1024×768 (paisagem): sem isto, o editor entraria na tela larga. Cada teste escolhe o modo.
const media = (wide: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: wide && !q.includes('hover'), media: q, addEventListener: () => {}, removeEventListener: () => {} }));
beforeEach(() => media(false));
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });

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
  it('deck inicial pronto: Main 30 e PRONTO, cópias no deck marcadas na maleta', () => {
    const s = newCampaign(5);
    const { container } = render(<DeckEditor progress={s} data={dataFor(s)} onChange={vi.fn()} onBack={vi.fn()} />);
    expect(container.querySelector('.deckhead')!.textContent).toContain('Main 30');
    expect(screen.getByText('PRONTO')).toBeTruthy();
    expect(container.querySelectorAll('.deckpanel .cell')).toHaveLength(30);
    expect(container.querySelectorAll('.trunkgrid .cell.indeck').length).toBeGreaterThan(0);
  });

  it('deck curto: "N problemas" e a lista ao tocar', () => {
    const s = newCampaign(5);
    s.decks[0].main = s.decks[0].main.slice(0, 17);
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
    expect(onChange.mock.calls[0][0].decks[0].main).toHaveLength(29);
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

describe('tela larga', () => {
  it('três colunas, sem gaveta; clicar fixa a carta no painel e "Tirar do deck" funciona sem zoom', () => {
    media(true);
    const s = newCampaign(1);
    const onChange = vi.fn();
    const { container } = render(<DeckEditor progress={s} data={dataFor(s)} onChange={onChange} onBack={() => {}} />);
    expect(container.querySelector('.deckeditor.wide')).not.toBeNull();
    expect(container.querySelector('.drawerhandle')).toBeNull();
    const first = container.querySelector('.deckpanel .cell')!;
    fireEvent.click(first);
    expect(document.querySelector('.cardzoom')).toBeNull();
    expect(container.querySelector('.deckside .nm')?.textContent).toBe(first.getAttribute('aria-label'));
    fireEvent.click(screen.getByRole('button', { name: /Tirar do deck/ }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].decks[0].main).toHaveLength(s.decks[0].main.length - 1);
  });

  it('o botão de tamanho troca P/M/G e fica lembrado', () => {
    media(true);
    const s = newCampaign(1);
    render(<DeckEditor progress={s} data={dataFor(s)} onChange={() => {}} onBack={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Tamanho das cartas: médias/ }));
    expect(screen.getByRole('button', { name: /Tamanho das cartas: grandes/ })).toBeTruthy();
    expect(localStorage.getItem('duel-days.cardSize')).toBe('"G"');
  });
});

/** O editor com o save de verdade (cada `onChange` vira a nova `progress`). */
function Live({ s0, data, spy }: { s0: CampaignState; data: GameData; spy?: (s: CampaignState) => void }) {
  const [s, set] = useState(s0);
  return <DeckEditor progress={s} data={data} onChange={(n) => { set(n); spy?.(n); }} onBack={() => {}} />;
}
const sheetBtn = (name: RegExp) => screen.getByRole('button', { name });

describe('desfazer mudanças e limpar (folha dos decks)', () => {
  it('"Desfazer mudanças" volta o deck a como estava ao abrir o editor, com confirmação', () => {
    const s = newCampaign(1);
    let last = s;
    const { container } = render(<Live s0={s} data={dataFor(s)} spy={(n) => { last = n; }} />);
    fireEvent.click(container.querySelector('.deckpanel .cell')!);
    fireEvent.click(sheetBtn(/Tirar do deck/));
    fireEvent.click(screen.getAllByRole('button', { name: 'Fechar' })[0]);
    expect(last.decks[0].main).toHaveLength(s.decks[0].main.length - 1);
    fireEvent.click(sheetBtn(/Escolher o deck/));
    fireEvent.click(sheetBtn(/Desfazer mudanças/));
    expect(screen.getByRole('status').textContent).toMatch(/como estava quando você abriu o editor/);
    expect(last.decks[0].main).toHaveLength(s.decks[0].main.length - 1); // ainda não
    fireEvent.click(sheetBtn(/Desfazer mesmo/));
    expect(last.decks[0].main).toEqual(s.decks[0].main);
    expect((sheetBtn(/Desfazer mudanças/) as HTMLButtonElement).disabled).toBe(true);
  });

  it('sem mudança na visita, "Desfazer mudanças" fica indisponível', () => {
    const s = newCampaign(1);
    render(<Live s0={s} data={dataFor(s)} />);
    fireEvent.click(sheetBtn(/Escolher o deck/));
    expect((sheetBtn(/Desfazer mudanças/) as HTMLButtonElement).disabled).toBe(true);
  });

  it('"Limpar" esvazia o deck depois do segundo toque e avisa quando é o deck em uso', () => {
    const s = newCampaign(1);
    let last = s;
    render(<Live s0={s} data={dataFor(s)} spy={(n) => { last = n; }} />);
    fireEvent.click(sheetBtn(/Escolher o deck/));
    fireEvent.click(sheetBtn(/^Limpar$/));
    expect(screen.getByRole('status').textContent).toMatch(/deck em uso/);
    expect(last.decks[0].main.length).toBeGreaterThan(0);
    fireEvent.click(sheetBtn(/Limpar mesmo/));
    expect(last.decks[0].main).toEqual([]);
    expect(last.decks[0].extra).toEqual([]);
    expect((sheetBtn(/^Limpar$/) as HTMLButtonElement).disabled).toBe(true);
    // E dá para desfazer a limpeza: volta às cartas do começo da visita.
    fireEvent.click(sheetBtn(/Desfazer mudanças/));
    fireEvent.click(sheetBtn(/Desfazer mesmo/));
    expect(last.decks[0].main).toEqual(s.decks[0].main);
  });
});
