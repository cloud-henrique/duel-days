// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DuelMenu } from './DuelMenu';

afterEach(cleanup);
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

describe('DuelMenu', () => {
  it('Desistir pede confirmação antes de desistir', () => {
    const onSurrender = vi.fn();
    render(<DuelMenu onSurrender={onSurrender} />);
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
    render(<DuelMenu onSurrender={onSurrender} />);
    click('Menu');
    click('Fechar'); // o fundo (Backdrop) é um botão "Fechar"
    expect(screen.queryByText('Desistir')).toBeNull();
    expect(onSurrender).not.toHaveBeenCalled();
  });

  it('Continuar na confirmação volta ao duelo', () => {
    const onSurrender = vi.fn();
    render(<DuelMenu onSurrender={onSurrender} />);
    click('Menu'); click('Desistir'); click('Continuar');
    expect(screen.queryByText('Desistir do duelo?')).toBeNull();
    expect(onSurrender).not.toHaveBeenCalled();
  });
});
