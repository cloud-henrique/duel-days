// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { soundForButton } from './buttonSounds';

const el = (html: string) => { document.body.innerHTML = html; return document.querySelector('#t')!; };

describe('som dos botões', () => {
  it('botão comum toca o tap; voltar, fechar e perigo tocam o back', () => {
    expect(soundForButton(el('<button id="t">Duelar</button>'))).toBe('tap');
    expect(soundForButton(el('<button id="t" aria-label="Voltar"></button>'))).toBe('back');
    expect(soundForButton(el('<button id="t">Voltar ao mapa</button>'))).toBe('back');
    expect(soundForButton(el('<button id="t" class="hud-btn danger">Deixa pra lá</button>'))).toBe('back');
    expect(soundForButton(el('<button><span id="t">Fechar</span></button>'))).toBe('back');
  });

  it('data-sound escolhe ou cala; no duelo e fora de botão, nada', () => {
    expect(soundForButton(el('<button id="t" data-sound="dialogue"></button>'))).toBe('dialogue');
    expect(soundForButton(el('<button id="t" data-sound="none">Ok</button>'))).toBeNull();
    expect(soundForButton(el('<div class="duel"><button id="t">Atacar</button></div>'))).toBeNull();
    expect(soundForButton(el('<div id="t">texto</div>'))).toBeNull();
  });
});
