// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Welcome } from './Welcome';
import { ProfileScreen } from './ProfileScreen';
import { PLAYER_AVATARS } from '../../story/profile';
import type { Progress } from '../../story/progress';

afterEach(cleanup);

describe('Welcome', () => {
  it('começar fica desativado com o nome vazio ou só com espaços', () => {
    render(<Welcome onDone={vi.fn()} />);
    const start = screen.getByRole('button', { name: /Começar/ });
    expect((start as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText('Seu nome'), { target: { value: '   ' } });
    expect((start as HTMLButtonElement).disabled).toBe(true);
  });

  it('grava nome, avatar e tratamento escolhidos; o título segue o tratamento', () => {
    const onDone = vi.fn();
    render(<Welcome onDone={onDone} />);
    expect(screen.getByRole('heading').textContent).toBe('Boas-vindas ao Duel Days!');
    expect(screen.getAllByRole('radio', { name: /Alun|Moç|Menin|Rapaz/ })).toHaveLength(14);
    fireEvent.change(screen.getByPlaceholderText('Seu nome'), { target: { value: '  Ana ' } });
    fireEvent.click(screen.getByRole('radio', { name: PLAYER_AVATARS[4].label }));
    fireEvent.click(screen.getByRole('radio', { name: 'Ela' }));
    expect(screen.getByRole('heading').textContent).toBe('Bem-vinda ao Duel Days!');
    fireEvent.click(screen.getByRole('button', { name: /Começar/ }));
    expect(onDone).toHaveBeenCalledWith({ name: 'Ana', avatar: PLAYER_AVATARS[4].id, address: 'she' });
  });
});

describe('ProfileScreen', () => {
  const progress = { playerName: 'Ana', wins: { joey: 2, bakura: 1 }, losses: { kaiba: 1 } } as unknown as Progress;

  it('estatísticas: 3 vitórias, 1 derrota, 75%', () => {
    render(<ProfileScreen progress={progress} onChange={vi.fn()} onBack={vi.fn()} />);
    const box = screen.getByLabelText('Estatísticas');
    expect(box.textContent).toContain('3Vitórias');
    expect(box.textContent).toContain('1Derrotas');
    expect(box.textContent).toContain('75%');
  });

  it('trocar o avatar vale na hora', () => {
    const onChange = vi.fn();
    render(<ProfileScreen progress={progress} onChange={onChange} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: PLAYER_AVATARS[7].label }));
    expect(onChange).toHaveBeenLastCalledWith({ name: 'Ana', avatar: PLAYER_AVATARS[7].id, address: 'neutral' });
  });
});
