import { describe, expect, it } from 'vitest';
import { DIALOGUE, type Line } from './data/types';
import { greetingBand, greetingScene, postDuelScene, preDuelScene } from './encounter';
import { fillText, type Address } from './text';
import { newCampaign } from './state';

/** Toda fala do conteúdo, de qualquer lugar do JSON. */
function allLines(): Line[] {
  const out: Line[] = [];
  const walk = (x: unknown) => {
    if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === 'object') {
      if ('text' in x && 'expression' in x) out.push(x as Line);
      else Object.values(x).forEach(walk);
    }
  };
  walk(DIALOGUE);
  return out;
}

describe('texto das falas', () => {
  it('troca {nome} e escolhe o trecho pelo tratamento', () => {
    const t = 'Oi, {nome}! {Bem-vindo|Bem-vinda|Boas-vindas}!';
    expect(fillText(t, 'Ana', 'she')).toBe('Oi, Ana! Bem-vinda!');
    expect(fillText(t, 'Rui', 'he')).toBe('Oi, Rui! Bem-vindo!');
    expect(fillText(t, 'Sam', 'neutral')).toBe('Oi, Sam! Boas-vindas!');
  });

  it('nenhuma fala sobra com chave nem passa de 160 caracteres, nos 3 tratamentos', () => {
    const lines = allLines();
    expect(lines.length).toBeGreaterThan(380);
    for (const a of ['he', 'she', 'neutral'] as Address[]) for (const l of lines) {
      const out = fillText(l.text, 'Ana', a);
      expect(out, l.text).not.toMatch(/[{}]/);
      expect(out.length, l.text).toBeLessThanOrEqual(160);
    }
  });
});

describe('falas do encontro', () => {
  const s = newCampaign(3);
  it('saudação comum sem laço, de proximidade com 2 corações e a da rota depois da escolha', () => {
    expect(greetingBand(s, 'tea')).toBeNull();
    expect(DIALOGUE.duelists.tea.greeting).toContain(greetingScene(s, 'tea'));
    const close = { ...s, affinity: { tea: 210 } };
    expect(greetingBand(close, 'tea')).toBe('close');
    expect(DIALOGUE.duelists.tea.bondGreetings.close).toContain(greetingScene(close, 'tea'));
    const rom = { ...s, affinity: { tea: 310 }, bondRoutes: { tea: 'romance' as const } };
    expect(DIALOGUE.duelists.tea.bondGreetings.romance).toContain(greetingScene(rom, 'tea'));
  });

  it('a mesma variante no mesmo período', () => {
    expect(greetingScene(s, 'joey')).toBe(greetingScene({ ...s }, 'joey'));
  });

  it('chefe: entrada antes de ser vencido; depois, a fala comum', () => {
    expect(preDuelScene(s, 'yugi', 'regular')).toBe(DIALOGUE.duelists.yugi.bossEntrance);
    const beaten = { ...s, defeatedBosses: [1], victories: { yugi: 1 } };
    expect(DIALOGUE.duelists.yugi.beforeDuel).toContain(preDuelScene(beaten, 'yugi', 'regular'));
  });

  it('depois do duelo: derrota, primeira vitória, derrota do chefe e vitória comum', () => {
    expect(DIALOGUE.duelists.bakura.playerLoses).toContain(postDuelScene(s, 'bakura', 'lose', 'regular'));
    expect(postDuelScene(s, 'bakura', 'win', 'regular')).toBe(DIALOGUE.duelists.bakura.firstWin);
    expect(postDuelScene(s, 'yugi', 'win', 'regular')).toBe(DIALOGUE.duelists.yugi.bossDefeat);
    const again = { ...s, victories: { bakura: 1 } };
    expect(DIALOGUE.duelists.bakura.playerWins).toContain(postDuelScene(again, 'bakura', 'win', 'regular'));
  });

  it('duelo do evento: antes e depois são as cenas do evento', () => {
    const ev = { ...s, affinity: { joey: 100 }, victories: { joey: 1 } };
    const e1 = DIALOGUE.duelists.joey.bondEvents[0] as { before: Line[]; after: Line[] };
    expect(preDuelScene(ev, 'joey', 'bondEvent')).toBe(e1.before);
    expect(postDuelScene(ev, 'joey', 'win', 'bondEvent')).toBe(e1.after);
  });
});
