import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetLocal, clearProgress, loadLocal, markSynced, newProgress, replaceLocal, writeDebugProgress, writeProgress } from './progress';

beforeEach(async () => { await __resetLocal(); });

describe('o save do aparelho com o estado da sincronização', () => {
  it('sem save: nada pendente, nunca sincronizou', async () => {
    expect(await loadLocal()).toEqual({ progress: null, baseRev: 0, dirty: false, seq: 0, updatedAt: 0, debug: false });
  });

  it('gravar marca pendente e conta as gravações', async () => {
    await writeProgress(newProgress('Ana'));
    const a = await loadLocal();
    expect(a).toMatchObject({ baseRev: 0, dirty: true, seq: 1 });
    expect(a.progress?.playerName).toBe('Ana');
    expect((await writeProgress(newProgress('Bia')))).toBe(2);
  });

  it('o envio aceito limpa o pendente, a não ser que tenha gravado de novo enquanto ia', async () => {
    const seq = await writeProgress(newProgress('Ana'));
    await markSynced(1, seq);
    expect(await loadLocal()).toMatchObject({ baseRev: 1, dirty: false });
    const s2 = await writeProgress(newProgress('Ana 2'));
    await writeProgress(newProgress('Ana 3'));
    await markSynced(2, s2);
    expect(await loadLocal()).toMatchObject({ baseRev: 2, dirty: true });
  });

  it('trocar pelo da nuvem deixa limpo na revisão dela', async () => {
    await writeProgress(newProgress('Ana'));
    await replaceLocal(newProgress('Nuvem'), 7);
    const l = await loadLocal();
    expect(l).toMatchObject({ baseRev: 7, dirty: false });
    expect(l.progress?.playerName).toBe('Nuvem');
  });

  it('apagar um save que já esteve na nuvem fica pendente; um que nunca esteve, não', async () => {
    await writeProgress(newProgress('Ana'));
    await clearProgress();
    expect(await loadLocal()).toMatchObject({ progress: null, dirty: false });
    await replaceLocal(newProgress('Ana'), 3);
    await clearProgress();
    expect(await loadLocal()).toMatchObject({ progress: null, baseRev: 3, dirty: true });
  });
});

describe('save de depuração', () => {
  it('fica marcado até a nuvem trocá-lo; gravar depois não tira a marca', async () => {
    await writeDebugProgress(newProgress('Debug'));
    await writeProgress(newProgress('Debug 2'));
    expect(await loadLocal()).toMatchObject({ debug: true });
    await replaceLocal(newProgress('Nuvem'), 2);
    expect(await loadLocal()).toMatchObject({ debug: false });
  });
});
