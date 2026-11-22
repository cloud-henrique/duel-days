import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { DECK_PACING } from './pacing';

export type DropZone = 'deck' | 'trunk';
interface Pending {
  code: number; from: DropZone; el: HTMLElement; x: number; y: number; id: number; timer: ReturnType<typeof setTimeout> | null;
  /** Com mouse, arma ao mover (sem espera: a roda é que rola). */
  mouse: boolean;
}
interface Active { code: number; from: DropZone; ghost: HTMLElement; origin: DOMRect; dx: number; dy: number }

/** A camada das fantasmas: um portal no `body` (um pai com `transform`/contêiner mudaria a referência do `fixed`). */
function layer(): HTMLElement {
  let el = document.getElementById('drag-layer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'drag-layer';
    el.className = 'draglayer';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Arrastar cartas entre a maleta e o deck (o `DeckDrop` do nativo), com toque e com mouse:
 * - com dedo, segurar `holdMs` arma o arraste; mexer mais que `slopPx` antes disso é rolagem (nada acontece);
 * - com mouse, mover mais que `mouseSlopPx` com o botão apertado arma na hora (um clique sem mover continua clique);
 * - armado, uma fantasma (cópia da carta, maior e com sombra) segue o dedo e a rolagem fica presa;
 * - soltar sobre a outra área (`[data-drop]`) chama `onDrop`, que devolve se aceitou; recusada ou fora, a fantasma
 *   voa de volta à origem; o clique que vem depois do arraste é engolido (não abre o zoom).
 * Devolve `bind(code, from)` para as props do botão da carta e `dragging` (de onde está saindo, para destacar o alvo).
 */
export function useCardDrag(onDrop: (code: number, from: DropZone, to: DropZone) => boolean, reduced: boolean) {
  const [dragging, setDragging] = useState<DropZone | null>(null);
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  // Os ouvintes vão no `window` no pointerdown e saem no fim: precisam ser as mesmas funções a vida toda do componente.
  const api = useRef<ReturnType<typeof createDrag> | null>(null);
  api.current ??= createDrag({ drop: (c, f, t) => dropRef.current(c, f, t), reduced: () => reducedRef.current, setDragging });
  useEffect(() => api.current!.install(), []);
  return { bind: api.current.bind, dragging };
}

function createDrag(o: { drop: (code: number, from: DropZone, to: DropZone) => boolean; reduced: () => boolean; setDragging: (z: DropZone | null) => void }) {
  let pending: Pending | null = null;
  let active: Active | null = null;
  let swallowClick = false;

  const cleanup = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
  };
  function cancel() {
    if (pending?.timer) clearTimeout(pending.timer);
    pending = null;
    cleanup();
  }
  function arm() {
    const p = pending;
    if (!p) return;
    pending = null;
    const origin = p.el.getBoundingClientRect();
    const ghost = p.el.cloneNode(true) as HTMLElement;
    ghost.className = `${p.el.className} dragghost`;
    ghost.removeAttribute('aria-label');
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, { width: `${origin.width}px`, height: `${origin.height}px`, left: '0px', top: '0px' });
    layer().appendChild(ghost);
    active = { code: p.code, from: p.from, ghost, origin, dx: p.x - origin.left, dy: p.y - origin.top };
    place(p.x, p.y);
    o.setDragging(p.from);
  }
  function place(x: number, y: number) {
    if (active) active.ghost.style.transform = `translate(${x - active.dx}px, ${y - active.dy}px) scale(1.1)`;
  }
  function onMove(e: PointerEvent) {
    if (pending && e.pointerId === pending.id) {
      const moved = Math.hypot(e.clientX - pending.x, e.clientY - pending.y);
      if (pending.mouse) { if (moved > DECK_PACING.mouseSlopPx) { arm(); place(e.clientX, e.clientY); } }
      else if (moved > DECK_PACING.slopPx) cancel();
      return;
    }
    if (active) { e.preventDefault(); place(e.clientX, e.clientY); }
  }
  function end(): Active | null {
    const a = active;
    cleanup();
    active = null;
    o.setDragging(null);
    return a;
  }
  function onUp(e: PointerEvent) {
    if (pending) { cancel(); return; }
    const a = end();
    if (!a) return;
    swallowClick = true;
    setTimeout(() => { swallowClick = false; }, 400);
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop]') as HTMLElement | null;
    const zone = hit?.dataset.drop as DropZone | undefined;
    finish(a, !!zone && zone !== a.from && o.drop(a.code, a.from, zone));
  }
  function onCancel() {
    if (pending) { cancel(); return; }
    const a = end();
    if (a) finish(a, false);
  }
  /** Aceita: a fantasma some onde está. Recusada ou fora: volta à origem. */
  function finish(a: Active, ok: boolean) {
    const g = a.ghost;
    if (o.reduced() || typeof g.animate !== 'function') { g.remove(); return; }
    const to = ok ? `${g.style.transform} scale(.6)` : `translate(${a.origin.left}px, ${a.origin.top}px) scale(1)`;
    const anim = g.animate([{ transform: g.style.transform, opacity: 1 }, { transform: to, opacity: ok ? 0 : 0.6 }],
      { duration: DECK_PACING.flyMs, easing: 'ease-in-out', fill: 'forwards' });
    anim.onfinish = () => g.remove();
    anim.oncancel = () => g.remove();
  }

  /** Liga o bloqueio da rolagem e o "engolir o clique"; devolve a limpeza (desmontar). */
  function install() {
    // Enquanto arrasta, a página não rola (o Safari decide a rolagem no touchmove; o ouvinte precisa ser não passivo).
    const block = (e: TouchEvent) => { if (active) e.preventDefault(); };
    const eatClick = (e: MouseEvent) => { if (swallowClick) { swallowClick = false; e.stopPropagation(); e.preventDefault(); } };
    document.addEventListener('touchmove', block, { passive: false });
    document.addEventListener('click', eatClick, true);
    return () => {
      document.removeEventListener('touchmove', block);
      document.removeEventListener('click', eatClick, true);
      cancel();
      if (active) { active.ghost.remove(); active = null; }
    };
  }

  const bind = (code: number, from: DropZone): HTMLAttributes<HTMLButtonElement> => ({
    onPointerDown: (e) => {
      if (e.button !== 0 || pending || active) return;
      const mouse = e.pointerType === 'mouse';
      pending = { code, from, el: e.currentTarget, x: e.clientX, y: e.clientY, id: e.pointerId, mouse, timer: mouse ? null : setTimeout(arm, DECK_PACING.holdMs) };
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    },
    // Segurar no iOS abriria o menu da imagem; no desktop, o menu de contexto.
    onContextMenu: (e) => e.preventDefault(),
  });
  return { bind, install };
}
