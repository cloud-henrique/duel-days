// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { TitleScreen } from './TitleScreen';
import { SettingsScreen } from './SettingsScreen';
import { DEFAULT_SETTINGS, type Progress } from '../../story/progress';
import { newCampaign } from '../../campaign/state';

afterEach(cleanup);
const base: Progress = { playerName: 'Ana', wins: {}, losses: {}, campaign: null };
const handlers = () => ({ onPlay: vi.fn(), onDecks: vi.fn(), onProfile: vi.fn(), onSettings: vi.fn() });

describe('TitleScreen', () => {
  it('sem campanha: "Campanha"; entradas só do que existe', () => {
    render(<TitleScreen progress={base} {...handlers()} />);
    expect(screen.getByRole('button', { name: /^Campanha/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Meu deck/ })).toBeTruthy();
    expect(screen.queryByText(/Duelo rápido/)).toBeNull();
    expect(screen.queryByText(/Histórico/)).toBeNull();
    expect(screen.getByRole('heading', { name: 'Duel Days' })).toBeTruthy();
  });

  it('campanha em andamento: "Continuar", o dia, o período e o saldo em DP', () => {
    const h = handlers();
    render(<TitleScreen progress={{ ...base, campaign: { ...newCampaign(1), day: 5, period: 1, dp: 450 } }} {...h} />);
    const play = screen.getByRole('button', { name: /Continuar/ });
    expect(play.textContent).toContain('Dia 5 · Tarde');
    expect(play.querySelector('[aria-label="450 DP"]')).toBeTruthy();
    fireEvent.click(play);
    expect(h.onPlay).toHaveBeenCalledOnce();
  });

  it('campanha terminada: volta a dizer "Campanha"', () => {
    render(<TitleScreen progress={{ ...base, campaign: { ...newCampaign(1), day: 30, concluded: true } }} {...handlers()} />);
    expect(screen.getByRole('button', { name: /^Campanha/ }).textContent).toContain('30 dias acabaram');
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
    expect(onSettings).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, sound: false });
  });

  it('música: interruptor e volume próprios', () => {
    const onSettings = vi.fn();
    const { rerender } = render(<SettingsScreen settings={DEFAULT_SETTINGS} onSettings={onSettings} onErase={vi.fn()} onBack={vi.fn()} />);
    const slider = screen.getByRole('slider', { name: 'Volume da música' }) as HTMLInputElement;
    expect(slider.value).toBe('60');
    fireEvent.change(slider, { target: { value: '85' } });
    expect(onSettings).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, musicVolume: 0.85 });
    fireEvent.click(within(screen.getByRole('group', { name: 'Música' })).getByRole('button', { name: 'Desligada' }));
    expect(onSettings).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, music: false });
    rerender(<SettingsScreen settings={{ ...DEFAULT_SETTINGS, music: false }} onSettings={onSettings} onErase={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByRole('slider')).toBeNull();
  });
});
