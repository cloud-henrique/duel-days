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
import { MapScreen } from './MapScreen';
import { EncounterScreen } from './EncounterScreen';
import { present } from '../../campaign/map';

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

  it('mostra os pacotes ganhos, as coleções com preço, a próxima bloqueada e o próximo tier', () => {
    render(<ShopScreen campaign={base({ day: 2 })} data={fakeData()} onChange={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('3 para abrir, sem custo')).toBeTruthy();
    expect(screen.getByText('Spell Ruler').closest('section')!.textContent).toContain('Dia 3');
    expect(screen.getByText('Labyrinth of Nightmare').closest('section')!.textContent).toContain('Tier 2 · dia 8');
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

describe('MapScreen', () => {
  const noop = () => {};
  const props = { onShop: noop, onDecks: noop, onBonds: noop, onStatus: noop, onMenu: noop };

  it('só as cabeças, sem nome de lugar; tocar numa cabeça vai direto ao encontro', () => {
    const s = newCampaign(5);
    const here = present(s);
    const onMeet = vi.fn();
    render(<MapScreen s={s} onMeet={onMeet} {...props} />);
    expect(document.querySelectorAll('.pinhead')).toHaveLength(here.length);
    expect(screen.queryByText('Fliperama')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: `Encontrar ${here[0].name}` }));
    expect(onMeet).toHaveBeenCalledWith(here[0].key);
  });

  it('chefe com coroa; a loja fica no atalho de baixo', () => {
    const s = { ...newCampaign(5), victories: { tristan: 1, tea: 1, joey: 1, bakura: 1 } };
    const onShop = vi.fn();
    render(<MapScreen s={s} onMeet={vi.fn()} {...props} onShop={onShop} />);
    expect(document.querySelector('.pinhead.boss svg')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Loja/ }));
    expect(onShop).toHaveBeenCalled();
  });
});

describe('EncounterScreen sem laço', () => {
  const profile = { name: 'Ana', avatar: 'x', address: 'she' as const };
  it('Rex (Tier 2): cena da ilha, sem corações nem Conversar; depois da saudação, Duelar e Voltar', () => {
    const s = { ...newCampaign(5), day: 9 };
    render(<EncounterScreen s={s} duelist="rex" chars={{}} profile={profile} onChange={vi.fn()} onDuel={vi.fn()} onLeave={vi.fn()} />);
    expect(screen.getByText('Reino dos Duelistas')).toBeTruthy();
    expect(document.querySelector('.scene-hearts')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Pular/ }));
    expect(screen.queryByRole('button', { name: /Conversar/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Duelar/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Voltar ao mapa/ })).toBeTruthy();
  });
});
