// @vitest-environment happy-dom
// Fluxo do App no duelo final (change tier4-finais, task 6.1): vencer o Yami Yugi pela primeira vez toca a fala de derrota
// dele, depois a cena de campeão do amigo do epílogo, e volta ao mapa com o título gravado. O duelo em si é trocado por um
// botão que encerra com vitória pelo mesmo `rewardFor`/`onEnd` do duelo real; dados, save, nuvem e áudio também.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CardRecord } from './engine/session';
import type { Progress } from './story/progress';
import { CAMPAIGN, DIALOGUE, DUELISTS, PACKS } from './campaign/data/types';
import { debugPreset } from './campaign/debug';
import { newCampaign } from './campaign/state';

const WIN = { result: 'win' as const, turns: 9, lifePoints: 3000 };
const writes: Progress[] = [];
let saved: Progress;

vi.mock('./screens/duel/DuelScreen', async () => {
  const { createElement } = await import('react');
  return {
    DuelScreen: (p: { rewardFor?: (s: typeof WIN) => unknown; onEnd: (s: typeof WIN) => void }) =>
      createElement(
        'button',
        {
          onClick: () => {
            p.rewardFor?.(WIN);
            p.onEnd(WIN);
          },
        },
        'Vencer',
      ),
  };
});
vi.mock('./audio/music', () => ({ music: { setTrack: () => {}, setSettings: () => {} } }));
vi.mock('./audio/sfx', () => ({ sfx: { enabled: true, play: () => {} } }));
vi.mock('./data/cards', async orig => {
  const real = await orig<typeof import('./data/cards')>();
  const { CAMPAIGN: C, DUELISTS: D, PACKS: P } = await import('./campaign/data/types');
  const ids = new Set<number>();
  C.starterDeck.main.forEach(e => ids.add(e.id));
  D.forEach(d => [...d.deck.main, ...d.deck.extra, d.signatureCard].forEach(e => ids.add(e.id)));
  P.forEach(p => p.cards.forEach(c => ids.add(c.id)));
  const cards: Record<string, CardRecord> = {};
  for (const id of ids)
    cards[id] = {
      code: id,
      alias: 0,
      setcodes: [],
      type: 0x11,
      level: 4,
      attribute: 1,
      race: '1',
      attack: 1000,
      defense: 1000,
      lscale: 0,
      rscale: 0,
      link_marker: 0,
      name: `Carta ${id}`,
      desc: '',
    } as unknown as CardRecord;
  return { ...real, loadData: async () => ({ cards, tiers: {}, poolIds: [...ids] }) };
});
vi.mock('./story/progress', async orig => {
  const real = await orig<typeof import('./story/progress')>();
  const local = () => ({ progress: saved, baseRev: 0, dirty: false, seq: 0, updatedAt: 0, debug: true });
  return {
    ...real,
    loadProgress: async () => saved,
    loadLocal: async () => local(),
    writeProgress: async (p: Progress) => {
      writes.push(p);
      saved = p;
    },
    writeDebugProgress: async (p: Progress) => {
      writes.push(p);
      saved = p;
    },
    markSynced: async () => {},
    replaceLocal: async () => {},
  };
});

const { App } = await import('./App');

beforeEach(() => {
  writes.length = 0;
  // Joey com 5 eventos de laço: a cena de campeão é a dele. Sem nuvem (`?sync=off`).
  saved = {
    playerName: 'Ana',
    avatar: 'npc_duelists_common__ashley',
    address: 'she',
    wins: {},
    losses: {},
    campaign: debugPreset('final', newCampaign(5)),
  } as Progress;
  window.history.replaceState(null, '', '/?sync=off');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ json: async () => ({ characters: [] }) })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const skip = () => fireEvent.click(screen.getByRole('button', { name: /Pular/ }));
const plate = () => document.querySelector('.nameplate')?.textContent;

describe('App: vencer o duelo final', () => {
  it('fala de derrota do Yami Yugi, cena de campeão do Joey, e o mapa com o título', async () => {
    const final = DUELISTS.find(d => d.isFinal)!;
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /Continuar/ }));
    fireEvent.click(await screen.findByRole('button', { name: `Encontrar ${final.name}` }));
    skip(); // saudação de primeiro encontro
    fireEvent.click(await screen.findByRole('button', { name: /Duelar/ }));
    expect(screen.getByText(DIALOGUE.duelists[final.key].bossEntrance![0].text.replace('{nome}', 'Ana'))).toBeTruthy();
    skip(); // entrada de chefe
    fireEvent.click(await screen.findByRole('button', { name: 'Vencer' }));

    // A fala de derrota do Yami Yugi (a primeira vitória), e o título gravado com a cena do Joey.
    await screen.findByText(DIALOGUE.duelists[final.key].bossDefeat![0].text);
    await waitFor(() => expect(saved.campaign?.champion).toEqual({ day: 27, scene: 'joey' }));
    expect(saved.campaign?.victories[final.key]).toBe(1);
    skip();

    // A cena de campeão do Joey, no palco do duelo final.
    await waitFor(() => expect(plate()).toBe('Joey'));
    expect(screen.getByText(DIALOGUE.champion!.joey[0].text)).toBeTruthy();
    expect(screen.getByText('Arena da torre')).toBeTruthy();
    skip();

    // De volta ao mapa, na tarde do dia 27, com o título no cabeçalho.
    await waitFor(() =>
      expect(document.querySelector('.tierline')?.textContent).toContain('Campeão da Batalha da Cidade · dia 27'),
    );
    expect(screen.getByText('Tarde')).toBeTruthy();
  });

  it('a segunda vitória não toca a cena de campeão', async () => {
    const final = DUELISTS.find(d => d.isFinal)!;
    const c = saved.campaign!;
    saved = {
      ...saved,
      campaign: {
        ...c,
        victories: { ...c.victories, [final.key]: 1 },
        champion: { day: 26, scene: 'joey' },
        met: [...c.met, final.key],
      },
    };
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /Continuar/ }));
    fireEvent.click(await screen.findByRole('button', { name: `Encontrar ${final.name}` }));
    skip(); // saudação
    fireEvent.click(await screen.findByRole('button', { name: /Duelar/ }));
    skip(); // fala de antes do duelo
    fireEvent.click(await screen.findByRole('button', { name: 'Vencer' }));
    await waitFor(() => expect(saved.campaign?.victories[final.key]).toBe(2));
    skip(); // fala de vitória comum
    await waitFor(() => expect(document.querySelector('.tierline')).toBeTruthy());
    expect(screen.queryByText(DIALOGUE.champion!.joey[0].text)).toBeNull();
    expect(saved.campaign?.champion).toEqual({ day: 26, scene: 'joey' });
  });
});

// Garante que os dados reais têm o que o teste usa.
it('dados: o duelo final e a cena do Joey existem', () => {
  expect(DUELISTS.some(d => d.isFinal)).toBe(true);
  expect(DIALOGUE.champion?.joey?.length).toBeGreaterThan(0);
  expect(CAMPAIGN.tiers).toHaveLength(4);
  expect(PACKS.length).toBeGreaterThan(0);
});
