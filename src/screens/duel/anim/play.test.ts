// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { playGroup } from './play';
import type { Step } from '../../../engine/protocol';

/** Animação falsa (o happy-dom não tem Web Animations). */
const fakeAnim = () => ({ cancel() {}, finished: Promise.resolve(), currentTime: 0 }) as unknown as Animation;

beforeEach(() => {
  document.body.innerHTML = '';
  (Element.prototype as unknown as { animate: () => Animation }).animate = fakeAnim;
});

/** Uma zona com uma carta baixada e o selo de ATK/DEF, como o `Slot` desenha. */
function setup() {
  const root = document.createElement('div');
  root.innerHTML = '<button class="zone s down" data-loc="0:szone:1"><img class="cardback-img"><i class="num">x</i></button>'
    + '<button class="zone m" data-loc="0:mzone:0"><div class="cardface"></div></button>';
  const layer = document.createElement('div');
  document.body.append(root, layer);
  return { root, layer, ctx: { root, layer, reducedMotion: false, faceOf: () => null } };
}

describe('playGroup', () => {
  it('virar uma carta na zona: a zona tracejada continua visível, só a carta some', () => {
    const { root, ctx } = setup();
    const zone = root.querySelector<HTMLElement>('[data-loc="0:szone:1"]')!;
    const steps: Step[] = [{ beat: { k: 'pos', at: { p: 0, zone: 'szone', seq: 1 }, code: 1, reveal: true, defense: false } }];
    const undo = playGroup(steps, 1, ctx);
    expect(zone.style.visibility).toBe('');
    expect([...zone.children].every((c) => (c as HTMLElement).style.visibility === 'hidden')).toBe(true);
    undo();
    expect([...zone.children].every((c) => (c as HTMLElement).style.visibility === '')).toBe(true);
  });

  it('carta saindo de uma zona (destruição): a zona fica', () => {
    const { root, ctx } = setup();
    const zone = root.querySelector<HTMLElement>('[data-loc="0:mzone:0"]')!;
    playGroup([{ beat: { k: 'move', from: { p: 0, zone: 'mzone', seq: 0 }, to: { p: 0, zone: 'grave', seq: 0 }, code: 1, why: 'destroy' } }], 1, ctx);
    expect(zone.style.visibility).toBe('');
    expect((zone.firstElementChild as HTMLElement).style.visibility).toBe('hidden');
  });
});
