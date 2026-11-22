import { describe, expect, it } from 'vitest';
import type { RemoteSave } from '../../server/protocol';
import { debugPreset } from '../campaign/debug';
import { CAMPAIGN_VERSION, newCampaign, type CampaignState } from '../campaign/state';
import { newProgress, type LocalSave, type Progress } from './progress';
import { formatSavedAt, reconcile, remoteProgress, summarize, versionOf } from './sync';

const p = (name = 'Ana'): Progress => newProgress(name);
const local = (o: Partial<LocalSave> = {}): LocalSave => ({ progress: p(), baseRev: 0, dirty: false, seq: 1, updatedAt: 0, debug: false, ...o });
const remote = (o: Partial<RemoteSave> = {}): RemoteSave => ({ rev: 1, version: CAMPAIGN_VERSION, data: p('Nuvem'), device: 'iPhone', updatedAt: 5, ...o });

describe('reconcile', () => {
  it('conta vazia: envia o do aparelho sobre a revisão 0; sem nada pendente, nada', () => {
    expect(reconcile(local({ dirty: true }), null)).toEqual({ kind: 'push', baseRev: 0 });
    expect(reconcile(local({ progress: null }), null)).toEqual({ kind: 'none' });
    // Um apagar pendente sobre uma conta vazia não tem o que enviar.
    expect(reconcile(local({ progress: null, dirty: true }), null)).toEqual({ kind: 'none' });
  });

  it('mesma revisão: envia se houver pendência; senão, nada', () => {
    expect(reconcile(local({ baseRev: 3, dirty: true }), remote({ rev: 3 }))).toEqual({ kind: 'push', baseRev: 3 });
    expect(reconcile(local({ baseRev: 3 }), remote({ rev: 3 }))).toEqual({ kind: 'none' });
  });

  it('apagar pendente: vira envio do apagar, ou nada se a nuvem já é lápide', () => {
    expect(reconcile(local({ progress: null, baseRev: 3, dirty: true }), remote({ rev: 3 }))).toEqual({ kind: 'push', baseRev: 3 });
    expect(reconcile(local({ progress: null, baseRev: 3, dirty: true }), remote({ rev: 3, data: null }))).toEqual({ kind: 'none' });
  });

  it('a nuvem andou e o aparelho não tem pendência: puxa (inclusive a lápide e o aparelho sem save)', () => {
    const r = remote({ rev: 4 });
    expect(reconcile(local({ baseRev: 3 }), r)).toEqual({ kind: 'pull', remote: r });
    const tomb = remote({ rev: 4, data: null });
    expect(reconcile(local({ baseRev: 3 }), tomb)).toEqual({ kind: 'pull', remote: tomb });
    expect(reconcile(local({ progress: null }), r)).toEqual({ kind: 'pull', remote: r });
  });

  it('os dois andaram: conflito, também com a lápide de um lado e com dois saves de antes da nuvem', () => {
    const r = remote({ rev: 4 });
    expect(reconcile(local({ baseRev: 3, dirty: true }), r)).toEqual({ kind: 'conflict', remote: r });
    const tomb = remote({ rev: 4, data: null });
    expect(reconcile(local({ baseRev: 3, dirty: true }), tomb)).toEqual({ kind: 'conflict', remote: tomb });
    expect(reconcile(local({ progress: null, baseRev: 3, dirty: true }), r)).toEqual({ kind: 'conflict', remote: r });
    expect(reconcile(local({ baseRev: 0, dirty: true }), remote({ rev: 1 }))).toMatchObject({ kind: 'conflict' });
  });

  it('os dois apagaram: só acerta a revisão', () => {
    const tomb = remote({ rev: 4, data: null });
    expect(reconcile(local({ progress: null, baseRev: 3, dirty: true }), tomb)).toEqual({ kind: 'pull', remote: tomb });
  });

  it('nuvem gravada por versão mais nova: para', () => {
    expect(reconcile(local({ dirty: true }), remote({ version: CAMPAIGN_VERSION + 1 }))).toEqual({ kind: 'update' });
    expect(reconcile(local(), remote({ version: CAMPAIGN_VERSION + 1 }), CAMPAIGN_VERSION + 1)).toMatchObject({ kind: 'pull' });
  });

  it('save de depuração: nunca envia e cede ao da conta', () => {
    expect(reconcile(local({ dirty: true, debug: true }), null)).toEqual({ kind: 'none' });
    const r = remote({ rev: 0 });
    expect(reconcile(local({ dirty: true, debug: true }), r)).toEqual({ kind: 'pull', remote: r });
  });
});

describe('versão e leitura', () => {
  it('a versão do envio é a maior entre o app e a campanha', () => {
    expect(versionOf(null)).toBe(CAMPAIGN_VERSION);
    expect(versionOf({ ...p(), campaign: { ...newCampaign(1), version: CAMPAIGN_VERSION + 2 } as unknown as CampaignState })).toBe(CAMPAIGN_VERSION + 2);
  });
  it('o save da nuvem passa pelo migrate; a lápide é "sem save"', () => {
    expect(remoteProgress(remote({ data: null }))).toBeNull();
    expect(remoteProgress(remote({ data: { ...p(), campaign: { ...newCampaign(1), version: 1 } } }))?.campaign).toBeNull();
  });
});

describe('summarize', () => {
  it('campanha real: dia e período, DP, vitórias e cartas diferentes', () => {
    const campaign = debugPreset('shop', null)!;
    const s = summarize({ ...p(), wins: { joey: 2, tea: 1 }, campaign }, 'Mac', 9);
    expect(s).toMatchObject({ erased: false, when: `Dia ${campaign.day} · Manhã`, dp: campaign.dp, wins: 3, device: 'Mac', savedAt: 9 });
    expect(s.cards).toBe(Object.keys(campaign.collection).length);
  });
  it('sem campanha, terminada e apagado', () => {
    expect(summarize(p(), 'Mac', 0).when).toBe('Sem campanha');
    expect(summarize({ ...p(), campaign: { ...newCampaign(1), concluded: true } }, 'Mac', 0).when).toBe('Campanha terminada');
    expect(summarize(null, 'iPhone', 0)).toMatchObject({ erased: true, when: 'Progresso apagado' });
  });
  it('hora salva relativa', () => {
    const now = new Date(2026, 10, 21, 15, 0).getTime();
    expect(formatSavedAt(new Date(2026, 10, 21, 14, 5).getTime(), now)).toBe('hoje, 14:05');
    expect(formatSavedAt(new Date(2026, 10, 20, 22, 10).getTime(), now)).toBe('ontem, 22:10');
    expect(formatSavedAt(new Date(2026, 2, 3, 9, 0).getTime(), now)).toMatch(/^3 de mar\.?, 09:00$/);
  });
});
