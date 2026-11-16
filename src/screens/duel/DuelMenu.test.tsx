// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DuelMenu } from './DuelMenu';
import { DEFAULT_SETTINGS } from '../../story/progress';

const menu = (onSurrender = vi.fn(), onSettings = vi.fn(), settings = DEFAULT_SETTINGS) =>
  render(<DuelMenu onSurrender={onSurrender} settings={settings} onSettings={onSettings} />);

afterEach(cleanup);
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

describe('DuelMenu', () => {
  it('Desistir pede confirmação antes de desistir', () => {
    const onSurrender = vi.fn();
    menu(onSurrender);
    click('Menu');
    click('Desistir');
    expect(onSurrender).not.toHaveBeenCalled();
    expect(screen.getByText('Desistir do duelo?')).toBeTruthy();
    click('Confirmar');
    expect(onSurrender).toHaveBeenCalledOnce();
    expect(screen.queryByText('Desistir do duelo?')).toBeNull();
  });

  it('tocar fora fecha o menu sem desistir', () => {
    const onSurrender = vi.fn();
    menu(onSurrender);
    click('Menu');
    click('Fechar'); // o fundo (Backdrop) é um botão "Fechar"
    expect(screen.queryByText('Desistir')).toBeNull();
    expect(onSurrender).not.toHaveBeenCalled();
  });

  it('Continuar na confirmação volta ao duelo', () => {
    const onSurrender = vi.fn();
    menu(onSurrender);
    click('Menu'); click('Desistir'); click('Continuar');
    expect(screen.queryByText('Desistir do duelo?')).toBeNull();
    expect(onSurrender).not.toHaveBeenCalled();
  });

  it('animações e som: a escolha atual aparece marcada e a nova vai para onSettings', () => {
    const onSettings = vi.fn();
    menu(vi.fn(), onSettings, DEFAULT_SETTINGS);
    click('Menu');
    expect(screen.getByRole('button', { name: 'Normal' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Ligado' }).getAttribute('aria-pressed')).toBe('true');
    click('Rápida');
    expect(onSettings).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, anim: 'fast' });
    click('Desligado');
    expect(onSettings).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, sound: false });
  });
});
