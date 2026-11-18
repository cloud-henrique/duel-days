import { describe, expect, it } from 'vitest';
import { cpuFor, starterDeck } from '../campaign/decks';
import { DuelDriver } from './driver';
import { openCore } from './session';
import { engineData, HAS_ENGINE_DATA } from './__testing__/duel';

describe('perfil do oponente', () => {
  it('Yugi (Tier 1) e Pegasus (Tier 2) são chefes; os outros, comuns', () => {
    expect(cpuFor('yugi')).toBe('chefe');
    expect(cpuFor('pegasus')).toBe('chefe');
    for (const k of ['tristan', 'tea', 'joey', 'bakura', 'weevil', 'rex', 'mako', 'keith', 'mai']) expect(cpuFor(k)).toBe('comum');
  });

  it.skipIf(!HAS_ENGINE_DATA)('o duelo usa o perfil pedido; sem perfil, o comum', async () => {
    const { cards, scripts } = engineData();
    const core = await openCore();
    const mk = (cpu?: 'comum' | 'chefe') => new DuelDriver(core, cards, (n) => scripts[n] ?? null, starterDeck(), starterDeck(), 1, undefined, cpu ? { cpu } : {});
    expect(mk().profile).toMatchObject({ kind: 'comum', peek: false, maxMs: 1000 });
    expect(mk('chefe').profile).toMatchObject({ kind: 'chefe', peek: true, maxMs: 2000 });
  });
});
