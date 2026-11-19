import { describe, expect, it } from 'vitest';
import { linkNotes, tagOf } from './Slot';
import type { BoardCard } from '../../engine/protocol';

const name = (c: number) => ({ 1: 'Peixe de 7 Cores', 2: 'Círculo da Profecia', 3: 'Machado do Desespero' }[c] ?? '?');
const fish: BoardCard = { code: 1, position: 1, links: [{ kind: 'target', dir: 'by', code: 2, controller: 1, location: 8, sequence: 0 }] };

describe('selo e notas das ligações', () => {
  it('monstro preso pelo Círculo: selo "Alvo" e a nota com o nome', () => {
    expect(tagOf(fish)).toEqual({ cls: 'target', text: 'Alvo' });
    expect(linkNotes(fish, name, true)).toEqual(['Alvo de Círculo da Profecia']);
  });
  it('a carta que mantém o alvo não ganha selo, mas a folha diz quem é o alvo', () => {
    const circle: BoardCard = { code: 2, position: 1, links: [{ kind: 'target', dir: 'to', code: 1, controller: 0, location: 4, sequence: 0 }] };
    expect(tagOf(circle)).toBeNull();
    expect(linkNotes(circle, name, false)).toEqual(['Alvo: Peixe de 7 Cores']);
  });
  it('equipado e tomado', () => {
    const m: BoardCard = { code: 1, position: 1, stolen: true, links: [{ kind: 'equip', dir: 'by', code: 3, controller: 0, location: 8, sequence: 1 }] };
    expect(tagOf(m)?.text).toBe('Tomado');
    expect(tagOf({ ...m, stolen: false })?.text).toBe('Equipado');
    expect(linkNotes(m, name, true)).toEqual(['Tomado do oponente', 'Equipado com Machado do Desespero']);
  });
});
