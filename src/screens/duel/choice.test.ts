import { describe, expect, it } from 'vitest';
import { OcgLocation, OcgMessageType, OcgResponseType, type OcgMessage } from 'ocgcore-wasm';
import fixtures from './__fixtures__/prompts.json';
import { choiceMarks, choiceOf, choiceText, placeCaption, tapOption } from './choice';
import { refKey } from './prompt';

const msg = (name: keyof typeof fixtures) => fixtures[name].msg as unknown as OcgMessage;
const mz = (controller: 0 | 1, sequence: number) => ({ code: 100 + sequence, controller, location: OcgLocation.MZONE, sequence, position: 1 });
const selectCard = (selects: object[], min = 1, max = 1, can_cancel = true) =>
  ({ type: OcgMessageType.SELECT_CARD, player: 0, can_cancel, min, max, selects }) as unknown as OcgMessage;

describe('choiceOf', () => {
  it('só prompts de escolha de cartas', () => {
    expect(choiceOf(msg('chain'))).toBeNull();
    expect(choiceOf(null)).toBeNull();
  });

  it('tudo no campo ou na mão: escolha no tabuleiro', () => {
    expect(choiceOf(msg('select_tribute'))?.mode).toBe('board');
    expect(choiceOf(msg('select_card'))?.mode).toBe('board'); // carta na zona de M/A
    expect(choiceOf(selectCard([mz(1, 0), mz(1, 2)]))?.mode).toBe('board');
  });

  it('alguma carta fora do campo (cemitério, deck): lista', () => {
    expect(choiceOf(selectCard([mz(1, 0), { code: 5, controller: 0, location: OcgLocation.DECK, sequence: 3, position: 1 }]))?.mode).toBe('list');
  });
});

describe('tapOption', () => {
  it('com uma carta a escolher, o toque já responde', () => {
    const c = choiceOf(selectCard([mz(1, 0), mz(1, 2)]))!;
    expect(tapOption(c, [], mz(1, 2))).toEqual({ sel: [1], response: { type: OcgResponseType.SELECT_CARD, indicies: [1] } });
  });

  it('carta que não vale: nada', () => {
    const c = choiceOf(selectCard([mz(1, 0)]))!;
    expect(tapOption(c, [], mz(0, 0))).toBeNull();
  });

  it('dois tributos: o primeiro marca, o segundo responde; tocar de novo desmarca', () => {
    const c = choiceOf(msg('select_tribute'))!;
    const [a, b] = c.options.map((o) => o.ref);
    const first = tapOption(c, [], a)!;
    expect(first).toEqual({ sel: [0] });
    expect(tapOption(c, first.sel, a)).toEqual({ sel: [] });
    expect(tapOption(c, first.sel, b)?.response).toEqual({ type: OcgResponseType.SELECT_TRIBUTE, indicies: [0, 1] });
  });

  it('quantidade livre (1 a 3): marca sem responder, até o máximo', () => {
    const c = choiceOf(selectCard([mz(1, 0), mz(1, 1), mz(1, 2)], 1, 3))!;
    let s = tapOption(c, [], mz(1, 0))!;
    expect(s.response).toBeUndefined();
    s = tapOption(c, s.sel, mz(1, 1))!;
    expect(s.response).toBeUndefined();
    expect(tapOption(c, s.sel, mz(1, 2))?.response).toEqual({ type: OcgResponseType.SELECT_CARD, indicies: [0, 1, 2] });
  });

  it('SELECT_UNSELECT_CARD: cada toque responde; desmarcar vem depois das que podem ser marcadas', () => {
    const m = { type: OcgMessageType.SELECT_UNSELECT_CARD, player: 0, can_finish: true, can_cancel: false, min: 1, max: 2, select_cards: [mz(0, 0), mz(0, 1)], unselect_cards: [mz(0, 3)] } as unknown as OcgMessage;
    const c = choiceOf(m)!;
    expect(tapOption(c, [], mz(0, 1))?.response).toEqual({ type: OcgResponseType.SELECT_UNSELECT_CARD, index: 1 });
    expect(tapOption(c, [], mz(0, 3))?.response).toEqual({ type: OcgResponseType.SELECT_UNSELECT_CARD, index: 2 });
    expect(choiceMarks(c, []).picked.has(refKey(mz(0, 3)))).toBe(true);
  });
});

describe('choiceMarks e textos', () => {
  it('as escolhíveis brilham e as marcadas saem do brilho', () => {
    const c = choiceOf(msg('select_tribute'))!;
    const { glow, picked } = choiceMarks(c, [0]);
    expect(picked.has(refKey(c.options[0].ref))).toBe(true);
    expect(glow.has(refKey(c.options[0].ref))).toBe(false);
    expect(glow.has(refKey(c.options[1].ref))).toBe(true);
  });

  it('textos do nativo', () => {
    const c = choiceOf(selectCard([mz(1, 0)]))!;
    expect(choiceText(c, 'Predador com Machado', true)).toEqual({ title: 'Escolha o alvo de Predador com Machado', hint: 'Toque no monstro que brilha em vermelho.' });
    expect(choiceText(c, null, false).hint).toBe('Toque na carta que brilha.');
    expect(choiceText(choiceOf(msg('select_tribute'))!, 'Gaia', false).title).toBe('Escolha 2 tributos para Gaia');
  });

  it('legenda de origem na lista', () => {
    expect(placeCaption({ controller: 0, location: OcgLocation.GRAVE, sequence: 0 })).toBe('Seu cemitério');
    expect(placeCaption({ controller: 1, location: OcgLocation.DECK, sequence: 0 })).toBe('Deck do oponente');
  });
});
