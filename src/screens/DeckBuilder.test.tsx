// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import type { CardRecord } from '../engine/session';
import type { Cards, GameData, Tier } from '../data/cards';
import { newCampaign } from '../campaign/state';
import { DeckBuilder } from './DeckBuilder';

afterEach(cleanup);

const rec = (code: number): CardRecord => ({
  code, alias: 0, setcodes: [], type: 0x11, level: 4, attribute: 1, race: '1', attack: 1000 + (code % 900), defense: 1000,
  lscale: 0, rscale: 0, link_marker: 0, name: `Carta ${code}`, desc: '',
} as CardRecord);

/** 2.000 cartas × 3 cópias = 6.000 cópias na aba Coleção (mais o deck inicial). */
function setup() {
  const s = newCampaign(1);
  const codes = Array.from({ length: 2000 }, (_, i) => 100000 + i);
  const all = [...new Set([...codes, ...Object.keys(s.collection).map(Number)])];
  for (const c of codes) s.collection[String(c)] = 3;
  const cards: Cards = Object.fromEntries(all.map((c) => [String(c), rec(c)]));
  const tiers: Record<string, Tier> = Object.fromEntries(all.map((c) => [String(c), 'N' as Tier]));
  const data: GameData = { cards, tiers, poolIds: all };
  return render(<DeckBuilder progress={s} data={data} onChange={() => {}} onBack={() => {}} />);
}

describe('grade do editor virtualizada', () => {
  it('com 6.000 cópias, monta só dezenas de células', () => {
    const { container } = setup();
    const cells = container.querySelectorAll('.cardgrid .cell').length;
    expect(cells).toBeGreaterThan(0);
    expect(cells).toBeLessThan(80);
  });

  it('o espaço de cima e de baixo representa as linhas não montadas', () => {
    const { container } = setup();
    const v = container.querySelector('.vgrid') as HTMLElement;
    expect(v.style.paddingTop).toBe('0px');
    expect(parseFloat(v.style.paddingBottom)).toBeGreaterThan(100000);
  });

  it('tocar numa carta abre o zoom', () => {
    const { container } = setup();
    fireEvent.click(container.querySelector('.cardgrid .cell')!);
    expect(container.querySelector('.cardzoom')).not.toBeNull();
  });

  it('filtrar pela busca volta ao topo e mostra só o que bate', async () => {
    const { container } = setup();
    const grid = container.querySelector('.cardgrid') as HTMLElement;
    grid.scrollTop = 5000;
    const input = container.querySelector('.filters input') as HTMLInputElement;
    await act(async () => { fireEvent.change(input, { target: { value: 'Carta 101999' } }); });
    expect(grid.scrollTop).toBe(0);
    expect(container.querySelectorAll('.cardgrid .cell').length).toBe(3);
  });
});
