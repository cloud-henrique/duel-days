// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TitleScreen } from './TitleScreen';
import { SettingsScreen } from './SettingsScreen';
import { DEFAULT_SETTINGS, type Progress } from '../../story/progress';

afterEach(cleanup);
const base = { playerName: 'Ana', coins: 450, wins: {}, losses: {}, run: null } as unknown as Progress;
const handlers = () => ({ onPlay: vi.fn(), onDecks: vi.fn(), onProfile: vi.fn(), onSettings: vi.fn() });

describe('TitleScreen', () => {
  it('jogo novo: "Jogar"; entradas só do que existe', () => {
    render(<TitleScreen progress={base} {...handlers()} />);
    expect(screen.getByRole('button', { name: /Jogar/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Meu deck/ })).toBeTruthy();
    expect(screen.queryByText(/Duelo rápido/)).toBeNull();
    expect(screen.queryByText(/Histórico/)).toBeNull();
    expect(screen.getByRole('heading', { name: 'Duel Days' })).toBeTruthy();
  });

  it('jogo em andamento: "Continuar" com o saldo em DP', () => {
    const h = handlers();
    render(<TitleScreen progress={{ ...base, wins: { joey_wheeler: 1 } }} {...h} />);
    const play = screen.getByRole('button', { name: /Continuar/ });
    expect(play.querySelector('[aria-label="450 DP"]')).toBeTruthy();
    fireEvent.click(play);
    expect(h.onPlay).toHaveBeenCalledOnce();
  });

  it('perfil e ajustes no topo', () => {
    const h = handlers();
    render(<TitleScreen progress={base} {...h} />);
    fireEvent.click(screen.getByRole('button', { name: 'Perfil: Ana' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }));
    expect(h.onProfile).toHaveBeenCalledOnce();
    expect(h.onSettings).toHaveBeenCalledOnce();
  });

  it('sem o logo: some, sem imagem quebrada', () => {
    const { container } = render(<TitleScreen progress={base} {...handlers()} />);
    fireEvent.error(container.querySelector('.titlelogo')!);
    expect(container.querySelector('.titlelogo')).toBeNull();
  });
});

describe('SettingsScreen', () => {
  it('apagar o save pede confirmação', () => {
    const onErase = vi.fn();
    render(<SettingsScreen settings={DEFAULT_SETTINGS} onSettings={vi.fn()} onErase={onErase} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Apagar save/ }));
    expect(onErase).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    expect(onErase).toHaveBeenCalledOnce();
  });

  it('desligar o som vai para onSettings', () => {
    const onSettings = vi.fn();
    render(<SettingsScreen settings={DEFAULT_SETTINGS} onSettings={onSettings} onErase={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Desligado' }));
    expect(onSettings).toHaveBeenLastCalledWith({ anim: 'normal', sound: false });
  });
});
