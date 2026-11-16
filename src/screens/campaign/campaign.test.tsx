// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { CardRecord } from '../../engine/session';
import type { GameData } from '../../data/cards';
import { CAMPAIGN, PACKS } from '../../campaign/data/types';
import { newCampaign, type CampaignState } from '../../campaign/state';
import { ShopScreen } from '../ShopScreen';
import { DeckBuilder } from '../DeckBuilder';
import { expressionFor } from './chars';

afterEach(cleanup);

/** Banco de cartas de mentira com todo id da campanha (monstro normal, nível 4). */
function fakeData(): GameData {
  const ids = new Set<number>();
  CAMPAIGN.starterDeck.main.forEach((e) => ids.add(e.id));
  PACKS.forEach((p) => p.cards.forEach((c) => ids.add(c.id)));
  const cards: Record<string, CardRecord> = {};
  for (const id of ids) cards[id] = { code: id, alias: 0, setcodes: [], type: 0x11, level: 4, attribute: 1, race: '1', attack: 1000, defense: 1000, lscale: 0, rscale: 0, link_marker: 0, name: `Carta ${id}`, desc: '' } as unknown as CardRecord;
  return { cards, tiers: {}, poolIds: [...ids] };
}

describe('expressões', () => {
  it('traduz as do nativo e cai para neutral', () => {
    expect(expressionFor(['neutral', 'laugh', 'embarrassed'], 'happy')).toBe('laugh');
    expect(expressionFor(['neutral', 'happy', 'laugh'], 'happy')).toBe('happy');
    expect(expressionFor(['neutral', 'embarrassed'], 'blushing')).toBe('embarrassed');
    expect(expressionFor(['neutral'], 'angry')).toBe('neutral');
  });
});

describe('ShopScreen', () => {
  const base = (extra: Partial<CampaignState> = {}): CampaignState => ({ ...newCampaign(5), ...extra });

  it('mostra os pacotes ganhos, as coleções com preço e a próxima bloqueada', () => {
    render(<ShopScreen campaign={base({ day: 6 })} data={fakeData()} onChange={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('3 para abrir, sem custo')).toBeTruthy();
    expect(screen.getByText('Spell Ruler').closest('section')!.textContent).toContain('Dia 11');
    expect(screen.getByText('Ferro e Músculo').closest('section')!.textContent).toContain('0/5');
  });

  it('sem DP: o botão fica desligado e diz quanto falta', () => {
    render(<ShopScreen campaign={base({ dp: 120, unopenedPacks: [] })} data={fakeData()} onChange={vi.fn()} onBack={vi.fn()} />);
    const lob = screen.getByText('Legend of Blue Eyes White Dragon').closest('section')!;
    expect((within(lob as HTMLElement).getByRole('button', { name: /1 pacote/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(lob.querySelector('[aria-label="30 DP"]')).toBeTruthy();
  });

  it('comprar desconta o DP e mostra as 5 cartas', () => {
    const onChange = vi.fn();
    render(<ShopScreen campaign={base({ dp: 500, unopenedPacks: [] })} data={fakeData()} onChange={onChange} onBack={vi.fn()} />);
    const lob = screen.getByText('Legend of Blue Eyes White Dragon').closest('section') as HTMLElement;
    fireEvent.click(within(lob).getByRole('button', { name: /1 pacote/ }));
    expect(onChange.mock.calls[0][0].dp).toBe(350);
    expect(document.querySelectorAll('.cardgrid .cell')).toHaveLength(5);
  });
});

describe('DeckBuilder na campanha', () => {
  it('edita o deck da campanha (coleção do deck inicial)', () => {
    const s = newCampaign(5);
    const onChange = vi.fn();
    render(<DeckBuilder progress={s} data={fakeData()} onChange={onChange} onBack={vi.fn()} />);
    expect(screen.getByText(/cartas diferentes/).textContent).toContain(String(Object.keys(s.collection).length));
  });
});
