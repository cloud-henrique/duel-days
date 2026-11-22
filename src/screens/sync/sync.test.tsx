// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { debugPreset } from '../../campaign/debug';
import { CAMPAIGN_VERSION } from '../../campaign/state';
import { newProgress, type LocalSave } from '../../story/progress';
import { createSyncEngine, type SyncState } from '../../story/syncEngine';
import { TitleScreen } from '../title/TitleScreen';
import { SettingsScreen } from '../title/SettingsScreen';
import { DEFAULT_SETTINGS } from '../../story/progress';
import { ConflictDialog } from './ConflictDialog';
import { SyncBadge } from './SyncBadge';
import { SyncProvider } from './SyncContext';
import { syncLabel } from './syncText';

afterEach(cleanup);

/** Um motor de verdade num estado fixo (o `getState` é trocado; o resto não faz pedido). */
function engineIn(state: Partial<SyncState>) {
  const e = createSyncEngine({
    api: { get: vi.fn(), put: vi.fn(), remove: vi.fn(), discard: vi.fn() },
    store: { load: vi.fn(), markSynced: vi.fn(), replace: vi.fn() }, device: () => 'Mac', onPulled: vi.fn(), enabled: true,
  });
  const s: SyncState = { status: 'synced', lastSync: null, conflict: null, ...state };
  return { ...e, getState: () => s, reconcile: vi.fn(async () => {}) };
}
const withSync = (state: Partial<SyncState>, ui: React.ReactNode, openConflict = vi.fn()) => {
  const engine = engineIn(state);
  render(<SyncProvider engine={engine} openConflict={openConflict}>{ui}</SyncProvider>);
  return { engine, openConflict };
};

describe('indicador', () => {
  it('sem provedor, não aparece', () => {
    render(<SyncBadge />);
    expect(screen.queryByRole('button', { name: /Nuvem/ })).toBeNull();
  });

  it.each([
    ['synced', 'Na nuvem'], ['syncing', 'Sincronizando'], ['checking', 'Sincronizando'], ['pending', 'Pendente'],
    ['expired', 'Entrar'], ['conflict', 'Escolher save'], ['update', 'Atualizar o app'], ['off', 'Nuvem desligada'],
  ] as const)('%s: "%s"', (status, short) => {
    withSync({ status }, <SyncBadge />);
    expect(screen.getByRole('button', { name: `Nuvem: ${short}` })).toBeTruthy();
  });

  it('sem rede: tocar explica que vai quando houver internet e deixa tentar agora', () => {
    const { engine } = withSync({ status: 'pending', lastSync: Date.now() }, <SyncBadge />);
    fireEvent.click(screen.getByRole('button', { name: 'Nuvem: Pendente' }));
    expect(screen.getByRole('dialog').textContent).toMatch(/quando houver internet/);
    expect(screen.getByRole('dialog').textContent).toMatch(/Última sincronização: hoje/);
    fireEvent.click(screen.getByRole('button', { name: /Tentar agora/ }));
    expect(engine.reconcile).toHaveBeenCalled();
  });

  it('sessão vencida: oferece entrar, sem abrir nada sozinho', () => {
    withSync({ status: 'expired' }, <SyncBadge />);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Nuvem: Entrar' }));
    expect(screen.getByRole('dialog').textContent).toMatch(/código enviado ao seu e-mail/);
    expect(screen.getByRole('button', { name: /^Entrar$/ })).toBeTruthy();
  });

  it('conflito: tocar reabre a escolha', () => {
    const { openConflict } = withSync({ status: 'conflict' }, <SyncBadge />);
    fireEvent.click(screen.getByRole('button', { name: 'Nuvem: Escolher save' }));
    expect(openConflict).toHaveBeenCalled();
  });

  it('desligada pela depuração: diz que a conta fica como estava', () => {
    expect(syncLabel({ status: 'off', lastSync: null, conflict: null, offReason: 'debug' }).long).toMatch(/conta fica como estava/);
  });

  it('no título, entre o perfil e os ajustes', () => {
    withSync({ status: 'synced' }, <TitleScreen progress={newProgress('Ana')} onPlay={vi.fn()} onDecks={vi.fn()} onProfile={vi.fn()} onSettings={vi.fn()} />);
    expect(document.querySelector('.titletop .syncbadge')).toBeTruthy();
  });
});

describe('abertura esperando a nuvem', () => {
  it('a campanha fica travada com "Sincronizando…" e libera depois', () => {
    const h = { onPlay: vi.fn(), onDecks: vi.fn(), onProfile: vi.fn(), onSettings: vi.fn() };
    const p = { ...newProgress('Ana'), campaign: debugPreset('boss', null) };
    const { rerender } = render(<TitleScreen progress={p} {...h} syncing />);
    const play = screen.getByRole('button', { name: /Continuar/ }) as HTMLButtonElement;
    expect(play.disabled).toBe(true);
    expect(play.textContent).toContain('Sincronizando…');
    rerender(<TitleScreen progress={p} {...h} />);
    expect((screen.getByRole('button', { name: /Continuar/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('escolha do conflito', () => {
  const local: LocalSave = {
    progress: { ...newProgress('Ana'), wins: { joey: 2 }, campaign: { ...debugPreset('boss', null)!, day: 4, period: 2 } },
    baseRev: 1, dirty: true, seq: 3, updatedAt: Date.now(), debug: false,
  };
  const remote = {
    rev: 2, version: CAMPAIGN_VERSION, device: 'Mac', updatedAt: Date.now(),
    data: { ...newProgress('Ana'), wins: { joey: 1 }, campaign: { ...debugPreset('boss', null)!, day: 5, period: 0, dp: 300 } },
  };

  it('mostra os dois lados com dia, DP, vitórias, cartas, aparelho e hora', () => {
    render(<ConflictDialog local={local} remote={remote} onChoose={vi.fn()} onLater={vi.fn()} />);
    const text = screen.getByRole('dialog').textContent!;
    expect(text).toContain('Dia 4 · Noite');
    expect(text).toContain('Dia 5 · Manhã');
    expect(text).toContain('Salvo no Mac, hoje');
    expect(text).toMatch(/2\s*vitórias/);
    expect(text).toMatch(/1\s*vitória\b/);
    expect(screen.getByRole('dialog').querySelector('[aria-label="300 DP"]')).toBeTruthy();
  });

  it('cada botão escolhe um lado; "decidir depois" fecha sem escolher', async () => {
    const onChoose = vi.fn(); const onLater = vi.fn();
    render(<ConflictDialog local={local} remote={remote} onChoose={onChoose} onLater={onLater} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ficar com a nuvem' })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ficar com este aparelho' })); });
    expect(onChoose.mock.calls).toEqual([['cloud'], ['local']]);
    fireEvent.click(screen.getByRole('button', { name: 'Decidir depois' }));
    expect(onLater).toHaveBeenCalled();
  });

  it('o lado apagado em outro aparelho', () => {
    render(<ConflictDialog local={local} remote={{ ...remote, data: null }} onChoose={vi.fn()} onLater={vi.fn()} />);
    expect(screen.getByRole('dialog').textContent).toContain('Progresso apagado');
  });
});

describe('apagar o save', () => {
  it('a confirmação diz que vale para todos os aparelhos', () => {
    render(<SettingsScreen settings={DEFAULT_SETTINGS} onSettings={vi.fn()} onErase={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Apagar save/ }));
    expect(document.body.textContent).toMatch(/todos os aparelhos em que você joga com esta conta/);
  });
});
