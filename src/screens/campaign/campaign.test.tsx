// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { CardRecord } from '../../engine/session';
import type { GameData } from '../../data/cards';
import { CAMPAIGN, PACKS } from '../../campaign/data/types';
import { newCampaign, type CampaignState } from '../../campaign/state';
import { ShopScreen } from '../shop/ShopScreen';
import { PackDetail } from '../shop/PackDetail';
import { packByKey, packStats } from '../../campaign/packs';
import { CollectionScreen } from './CollectionScreen';
import { expressionFor } from './chars';
import { MapScreen } from './MapScreen';
import { EncounterScreen } from './EncounterScreen';
import { Dialogue } from './Dialogue';
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
    // Strings: só `neutral` e `worried`
    expect(expressionFor(['neutral', 'worried'], 'sad')).toBe('worried');
    expect(expressionFor(['neutral', 'worried'], 'angry')).toBe('neutral');
    expect(expressionFor(['neutral', 'sad', 'worried'], 'sad')).toBe('sad');
    expect(expressionFor(['neutral'], 'angry')).toBe('neutral');
  });
});

describe('ShopScreen', () => {
  const base = (extra: Partial<CampaignState> = {}): CampaignState => ({ ...newCampaign(5), ...extra });
  const profile = { name: 'Ana', avatar: 'x', address: 'she' as const };
  const shop = (s: CampaignState, extra: { onChange?: () => void; onPack?: (k: string) => void } = {}) =>
    render(<ShopScreen campaign={s} data={fakeData()} chars={{}} profile={profile} onChange={extra.onChange ?? vi.fn()}
      onBack={vi.fn()} onPack={extra.onPack ?? vi.fn()} />);
  const cell = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

  it('balcão com o saldo e a fala, pacotes ganhos, vitrine com os bloqueios', () => {
    shop(base({ day: 2 }));
    expect(screen.getByText('3 pacotes esperando por você.')).toBeTruthy();
    expect(document.querySelector('.shopcounter .speech')).toBeTruthy();
    expect(cell('Spell Ruler').textContent).toContain('Dia 3');
    expect(cell('Labyrinth of Nightmare').textContent).toContain('Tier 2 · dia 8');
    expect(cell('Ferro e Músculo').textContent).toContain('0/5');
  });

  it('sem DP: a capa diz quanto falta; tocar abre o detalhe', () => {
    const onPack = vi.fn();
    shop(base({ dp: 120, unopenedPacks: [] }), { onPack });
    expect(cell('Legend of Blue Eyes').textContent).toContain('faltam 30 DP');
    fireEvent.click(cell('Legend of Blue Eyes'));
    expect(onPack).toHaveBeenCalledWith('lob');
  });

  it('bloqueado só balança e mostra o motivo', () => {
    const onPack = vi.fn();
    shop(base({ day: 2, unopenedPacks: [] }), { onPack });
    fireEvent.click(cell('Spell Ruler'));
    expect(onPack).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toContain('Chega à loja no dia 3');
  });

  it('abrir um pacote ganho: rasgar, revelar tudo e pronto', () => {
    const onChange = vi.fn();
    shop(base(), { onChange });
    fireEvent.click(screen.getByRole('button', { name: /Abrir pacote grátis/ }));
    expect(onChange.mock.calls[0][0].unopenedPacks).toHaveLength(2);
    expect(screen.getByText('Toque no pacote para abrir')).toBeTruthy();
  });
});

describe('PackDetail', () => {
  const profile = { name: 'Ana', avatar: 'x', address: 'she' as const };
  const detail = (s: CampaignState, onChange = vi.fn()) =>
    render(<PackDetail packKey="lob" campaign={s} data={fakeData()} chars={{}} profile={profile} onChange={onChange} onBack={vi.fn()} />);

  it('mostra o progresso e as cartas que faltam apagadas', () => {
    const s = newCampaign(5);
    detail(s);
    const st = packStats(s, packByKey('lob')!);
    expect(screen.getByText(`${st.owned} de ${st.total} cartas`)).toBeTruthy();
    expect(document.querySelectorAll('.packcards .cell')).toHaveLength(st.total);
    expect(document.querySelectorAll('.packcards .cell.missing')).toHaveLength(st.total - st.owned);
  });

  it('sem DP: "faltam" e não compra', () => {
    const onChange = vi.fn();
    detail({ ...newCampaign(5), dp: 60 }, onChange);
    fireEvent.click(screen.getByRole('button', { name: /Comprar 1 pacote/ }));
    expect(screen.getByRole('button', { name: /Comprar 1 pacote/ }).textContent).toContain('faltam 90 DP');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('comprar desconta e abre o pacote', () => {
    const onChange = vi.fn();
    detail({ ...newCampaign(5), dp: 500 }, onChange);
    fireEvent.click(screen.getByRole('button', { name: /Comprar 1 pacote/ }));
    expect(onChange.mock.calls[0][0].dp).toBe(350);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir o pacote' }));
  });

  it('a caixa pede confirmação; cancelar não gasta', () => {
    const onChange = vi.fn();
    detail({ ...newCampaign(5), dp: 5000 }, onChange);
    fireEvent.click(screen.getByRole('button', { name: /Caixa · 20 pacotes/ }));
    expect(screen.getByText('Comprar a caixa?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText('Comprar a caixa?')).toBeNull();
  });
});

describe('CollectionScreen', () => {
  it('totais e cada cópia uma miniatura; o zoom não põe no deck', () => {
    const s = newCampaign(5);
    const total = Object.values(s.collection).reduce((a, n) => a + n, 0);
    const { container } = render(<CollectionScreen s={s} data={fakeData()} onBack={vi.fn()} />);
    expect(container.querySelector('.colltotals')!.textContent).toContain(`${Object.keys(s.collection).length}Cartas diferentes`);
    expect(container.querySelector('.colltotals')!.textContent).toContain(`${total}No total`);
    fireEvent.click(container.querySelector('.trunkgrid .cell')!);
    expect(screen.queryByRole('button', { name: /Pôr no deck/ })).toBeNull();
  });
});

describe('MapScreen', () => {
  const noop = () => {};
  const props = { onShop: noop, onDecks: noop, onCollection: noop, onBonds: noop, onStatus: noop, onTitle: noop };

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

  it('chefe com a moldura dourada (sem coroa); a loja fica no atalho de baixo', () => {
    const s = { ...newCampaign(5), victories: { tristan: 1, tea: 1, joey: 1, bakura: 1 } };
    const onShop = vi.fn();
    render(<MapScreen s={s} onMeet={vi.fn()} {...props} onShop={onShop} />);
    expect(document.querySelector('.pinhead.boss')).toBeTruthy();
    expect(document.querySelector('.pinhead.boss svg')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Loja/ }));
    expect(onShop).toHaveBeenCalled();
  });

  it('Coleção na barra; Status pelas Opções do menu', () => {
    const onCollection = vi.fn(), onStatus = vi.fn();
    render(<MapScreen s={newCampaign(5)} onMeet={vi.fn()} {...props} onCollection={onCollection} onStatus={onStatus} />);
    expect(screen.queryByRole('button', { name: /^Status$/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Coleção/ }));
    expect(onCollection).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: /Status da campanha/ }));
    expect(onStatus).toHaveBeenCalled();
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

describe('EncounterScreen: resposta no fim do evento (change lacos-ate-o-fim)', () => {
  const profile = { name: 'Ana', avatar: 'x', address: 'she' as const };
  it('depois da cena do evento vencido, as opções; escolher grava, mostra o "+20" e volta ao mapa', () => {
    const s = { ...newCampaign(5), affinity: { tea: 100 }, victories: { tea: 1 }, bondEventsDone: { tea: 1 } };
    const onChange = vi.fn(), onLeave = vi.fn();
    const { rerender } = render(<EncounterScreen s={s} duelist="tea" chars={{}} profile={profile} afterDuel={[{ speaker: 'tea', expression: 'happy', text: 'Fim do evento.' }]}
      onChange={onChange} onDuel={vi.fn()} onLeave={onLeave} />);
    fireEvent.click(screen.getByRole('button', { name: /Pular/ }));
    const good = screen.getByRole('button', { name: /dois segredos/ });
    fireEvent.click(good);
    const saved = onChange.mock.calls[0][0] as CampaignState;
    expect(saved.bondPicks?.tea?.[1]).toBe(0);
    expect(saved.affinity.tea).toBe(120);
    rerender(<EncounterScreen s={saved} duelist="tea" chars={{}} profile={profile} afterDuel={[]} onChange={onChange} onDuel={vi.fn()} onLeave={onLeave} />);
    expect(document.querySelector('.heartsdelta.up')?.textContent).toBe('+20');
    fireEvent.click(screen.getByRole('button', { name: /Pular/ }));
    expect(onLeave).toHaveBeenCalled();
  });

  it('resposta pendente (app fechado): o menu oferece a escolha de novo', () => {
    const s = { ...newCampaign(5), affinity: { joey: 200 }, victories: { joey: 2 }, bondEventsDone: { joey: 2 }, bondPicks: { joey: { 1: 0 } } };
    render(<EncounterScreen s={s} duelist="joey" chars={{}} profile={profile} onChange={vi.fn()} onDuel={vi.fn()} onLeave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Pular/ }));
    fireEvent.click(screen.getByRole('button', { name: /O torneio do fliperama/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' })); // a última fala do evento, de novo
    expect(screen.getByRole('button', { name: /turno a mais/ })).toBeTruthy();
  });
});

describe('Dialogue: mudança de afinidade', () => {
  const profile = { name: 'Ana', avatar: 'x', address: 'she' as const };
  const stage = { bg: 'none', period: 'morning' as const, duelist: 'tea' };
  it('mostra o "+20" ao lado dos corações e, no fim da fala, volta sem botão de continuar', () => {
    const onDone = vi.fn();
    render(<Dialogue scene={[{ speaker: 'tea', expression: 'happy', text: 'Oi!' }]} stage={stage} chars={{}} profile={profile}
      top={{ title: 'Rua', hearts: 1.2, heartsDelta: 20 }} onDone={onDone} />);
    expect(document.querySelector('.scene-hearts-wrap .heartsdelta.up')?.textContent).toBe('+20');
    expect(screen.queryByText(/de afinidade/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    expect(onDone).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Continuar/ })).toBeNull();
  });

  it('sem mudança, nada ao lado dos corações', () => {
    render(<Dialogue scene={[]} stage={stage} chars={{}} profile={profile} top={{ title: 'Rua', hearts: 1, heartsDelta: 0 }} onDone={vi.fn()}>
      <p>menu</p></Dialogue>);
    expect(document.querySelector('.heartsdelta')).toBeNull();
  });
});
