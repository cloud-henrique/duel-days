/**
 * Encenação no DOM: o único módulo que conhece a Web Animations API e os retângulos medidos. Lê o efeito de cada beat
 * em `effectFor` e as durações do `PACING` (já multiplicadas pelo fator de velocidade). Os lugares são achados pelo
 * `data-loc` (`locKey`); `getBoundingClientRect` já inclui a perspectiva do campo inclinado.
 *
 * Cada chamada devolve uma limpeza, que a fila chama quando o tabuleiro seguinte é aplicado: o fantasma some quando a
 * carta real aparece. Efeitos que continuam por cima do tabuleiro novo (pilar de luz) se removem sozinhos ao terminar.
 * Uma falha aqui nunca derruba o duelo (quem chama protege com try/catch).
 */
import type { Beat, Loc, Step } from '../../../engine/protocol';
import { locKey } from '../../../engine/beats';
import { effectFor, type Effect } from './effects';
import { PACING } from './pacing';

export interface PlayCtx {
  /** A tela de duelo (onde ficam os `data-loc`). */
  root: HTMLElement;
  /** Camada fixa acima de tudo, fora de contêineres (portal no `body`), onde voam os fantasmas. */
  layer: HTMLElement;
  reducedMotion: boolean;
  /** A face da carta (a mesma do campo), como DOM estático; `null` se não houver. */
  faceOf: (code: number) => HTMLElement | null;
}

const BACK_SRC = `${import.meta.env.BASE_URL}cards/back.webp`;
const EASE_FLIGHT = 'cubic-bezier(.3,.7,.4,1)';
const EASE_TURN = 'cubic-bezier(.4,0,.2,1)';
/** Menor e maior escala do fantasma ao sair de um lugar de outro tamanho (contador do deck, placa, carta da mão). */
const MIN_SCALE = 0.25;
const MAX_SCALE = 1.4;
/** Proporção da carta (largura / altura), a mesma do `--card-ratio` do duel.css. */
const CARD_RATIO = 0.686;
/** O pilar de luz sobe acima da zona: altura em zonas. */
const PILLAR_ZONES = 2.4;
/** Escalonamento entre as cartas de uma compra múltipla (ms a 1×). */
const DRAW_STAGGER = 60;
/** Profundidade do giro 3D (px). */
const PERSPECTIVE = 600;
/** Momento do impacto no ataque (fração do avanço) e duração do flash e da tremida (ms a 1×). */
export const IMPACT_AT = 0.6;
const FLASH_MS = 220;
const SHAKE_MS = 320;
/** Pedaços da quebra: recortes da carta e para onde cada um se afasta (fração do tamanho da carta). */
const SHARDS: [string, number, number, number][] = [
  ['polygon(0 0, 55% 0, 45% 50%, 0 45%)', -0.35, -0.3, -18],
  ['polygon(55% 0, 100% 0, 100% 55%, 45% 50%)', 0.35, -0.3, 16],
  ['polygon(0 45%, 45% 50%, 50% 100%, 0 100%)', -0.3, 0.35, 14],
  ['polygon(45% 50%, 100% 55%, 100% 100%, 50% 100%)', 0.3, 0.35, -16],
];
/** O fantasma que vai ao cemitério depois da quebra é menor que a carta. */
const SHARD_GHOST_SCALE = 0.6;

const find = (root: HTMLElement, key: string) => root.querySelector<HTMLElement>(`[data-loc="${key}"]`);
const isCard = (el: HTMLElement) => el.matches('button.slot, button.zone, .foecard');
const isZone = (el: HTMLElement) => el.classList.contains('zone');

/**
 * Elemento de um lugar, com as trocas quando ele não está visível: mão nova (sem carta ainda) vai à última carta da mão
 * ou à própria mão; deck e cemitério são os da placa; banidas, Extra Deck e "fora do jogo" saem da placa do dono.
 */
function resolve(root: HTMLElement, l: Loc): HTMLElement | null {
  const exact = find(root, locKey(l));
  if (exact) return exact;
  if (l.zone === 'hand') {
    const cards = root.querySelectorAll<HTMLElement>(`[data-loc^="${l.p}:hand:"]`);
    return cards[cards.length - 1] ?? find(root, `${l.p}:hand`);
  }
  return find(root, `${l.p}:plate`);
}

interface Box { x: number; y: number; w: number; h: number }
const center = (b: Box) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2 });

/** Tamanho de uma carta numa zona de monstro, para fantasmas entre lugares que não são cartas. */
function cardSize(root: HTMLElement) {
  const z = root.querySelector<HTMLElement>('.zone.m')?.getBoundingClientRect();
  return z ? { w: z.height * CARD_RATIO, h: z.height } : { w: 60, h: 87 };
}

/**
 * Caixa de carta de um lugar: a própria carta (mão, versos); dentro de uma zona, uma carta da altura da zona, no centro
 * (sem contar o giro de defesa); em pilhas e placas, uma carta de zona no centro delas.
 */
function cardBox(root: HTMLElement, el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  if (isZone(el)) {
    const def = el.classList.contains('def');
    const h = def ? r.width : r.height;
    const w = Math.min(h * CARD_RATIO, def ? r.height : r.width);
    return { x: r.left + r.width / 2 - w / 2, y: r.top + r.height / 2 - h / 2, w, h };
  }
  if (isCard(el)) return { x: r.left, y: r.top, w: r.width, h: r.height };
  const { w, h } = cardSize(root);
  return { x: r.left + r.width / 2 - w / 2, y: r.top + r.height / 2 - h / 2, w, h };
}

function back(): HTMLElement {
  const img = document.createElement('img');
  img.className = 'cardback-img';
  img.src = BACK_SRC;
  img.alt = '';
  return img;
}

/** O conteúdo do fantasma: a face da carta (se ela é pública), a face/verso clonada da origem, ou um verso. */
function content(ctx: PlayCtx, from: HTMLElement | null, code: number, faceDown: boolean): HTMLElement {
  if (faceDown) return back();
  const face = code ? ctx.faceOf(code) : null;
  if (face) return face;
  const inner = from && isCard(from) ? from.querySelector<HTMLElement>('.cardface, .cardback-img') : null;
  return inner ? (inner.cloneNode(true) as HTMLElement) : back();
}

function ghostAt(ctx: PlayCtx, box: Box, child: HTMLElement, cls = 'ghost'): HTMLElement {
  const g = document.createElement('div');
  g.className = cls;
  Object.assign(g.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
  g.appendChild(child);
  ctx.layer.appendChild(g);
  return g;
}

/** O que a limpeza desfaz: fantasmas a remover e cartas reais escondidas durante a encenação. */
interface Undo { nodes: HTMLElement[]; anims: Animation[]; hidden: HTMLElement[] }
const hide = (u: Undo, el: HTMLElement | null) => { if (el && isCard(el)) { el.style.visibility = 'hidden'; u.hidden.push(el); } };

interface FlightOpts { code?: number; faceDown?: boolean; fade?: boolean; endTurn?: number; delay?: number; scale?: number; fadeOut?: boolean }

/** Voo de um fantasma de um lugar a outro (ou só um fade no destino, sem origem ou com "reduzir movimento"). */
function flight(ctx: PlayCtx, u: Undo, fromLoc: Loc | null, toLoc: Loc, ms: number, o: FlightOpts = {}): Box | null {
  const to = resolve(ctx.root, toLoc);
  if (!to) return null;
  const from = fromLoc ? resolve(ctx.root, fromLoc) : null;
  const box = cardBox(ctx.root, to);
  const ghost = ghostAt(ctx, box, content(ctx, from, o.code ?? 0, !!o.faceDown));
  u.nodes.push(ghost);
  // A carta de origem some enquanto o fantasma voa (volta quando o tabuleiro novo entra).
  if (from !== to) hide(u, from);
  const turn = (deg: number) => (deg ? ` rotate(${deg}deg)` : '');
  const timing: KeyframeAnimationOptions = { duration: ms, delay: o.delay ?? 0, easing: EASE_FLIGHT, fill: 'both' };
  if (!from || from === to || o.fade) {
    u.anims.push(ghost.animate([{ opacity: 0, transform: turn(o.endTurn ?? 0) || 'none' }, { opacity: 1, transform: turn(o.endTurn ?? 0) || 'none' }], { ...timing, easing: 'ease-out' }));
    return box;
  }
  const f = from.getBoundingClientRect();
  const a = center(box);
  const dx = f.left + f.width / 2 - a.cx, dy = f.top + f.height / 2 - a.cy;
  const s = o.scale ?? Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(f.width / box.w, f.height / box.h)));
  const end = o.scale ? `scale(${o.scale})` : 'scale(1)';
  u.anims.push(ghost.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 1 }, { transform: `translate(0, 0) ${end}${turn(o.endTurn ?? 0)}`, opacity: o.fadeOut ? 0 : 1 }],
    timing,
  ));
  return box;
}

/** Flash de luz sobre um lugar (impacto do ataque, início da quebra). */
function flash(ctx: PlayCtx, el: HTMLElement, ms: number, delay: number, color = '#fff') {
  const box = cardBox(ctx.root, el);
  const f = document.createElement('div');
  f.className = 'flash';
  f.style.background = color;
  Object.assign(f.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
  ctx.layer.appendChild(f);
  // Termina sozinho (não é cortado quando o tabuleiro seguinte entra).
  const anim = f.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.3 }, { opacity: 0 }], { duration: ms, delay, fill: 'both' });
  anim.finished.then(() => f.remove(), () => f.remove());
}

/** Tremida da tela no impacto (amplitudes do `PACING`). */
function shake(ctx: PlayCtx, amps: readonly number[], ms: number, delay: number) {
  if (!amps.length) return;
  ctx.root.animate(amps.map((x) => ({ transform: x ? `translateX(${x}px)` : 'none' })), { duration: ms, delay, easing: 'linear' });
}

/**
 * Ataque: o atacante recua, avança até perto do alvo (vetor entre os centros medidos; no ataque direto, a placa do
 * oponente) crescendo, e volta; no impacto, o alvo pisca e a tela treme. Com "reduzir movimento" (`flash`), só pisca.
 */
function attack(ctx: PlayCtx, u: Undo, b: Extract<Beat, { k: 'attack' }>, e: Effect, factor: number) {
  const from = resolve(ctx.root, b.from);
  const target = b.to ? resolve(ctx.root, b.to) : find(ctx.root, `${b.from.p === 0 ? 1 : 0}:plate`);
  if (!from || !target) return;
  if (e.kind === 'flash') { flash(ctx, target, (e.durations.flash ?? FLASH_MS) * factor, 0); return; }
  const ms = (e.durations.lunge ?? 0) * factor;
  const box = cardBox(ctx.root, from);
  const t = target.getBoundingClientRect();
  const a = center(box);
  const vx = t.left + t.width / 2 - a.cx, vy = t.top + t.height / 2 - a.cy;
  const { recoil, reach, scale } = PACING.attack;
  const g = ghostAt(ctx, box, content(ctx, from, b.code, false));
  g.classList.add('attacker');
  u.nodes.push(g);
  hide(u, from);
  u.anims.push(g.animate([
    { transform: 'none' },
    { transform: `translate(${vx * recoil}px, ${vy * recoil}px)`, offset: 0.25 },
    { transform: `translate(${vx * reach}px, ${vy * reach}px) scale(${scale})`, offset: IMPACT_AT, easing: 'ease-out' },
    { transform: 'none' },
  ], { duration: ms, easing: 'ease-in', fill: 'both' }));
  flash(ctx, target, FLASH_MS * factor, ms * IMPACT_AT);
  shake(ctx, e.shake, SHAKE_MS * factor, ms * IMPACT_AT);
}

/** Quebra: a carta pisca em vermelho-branco e se parte em 4 pedaços que se afastam; um fantasma menor vai ao cemitério. */
function shatter(ctx: PlayCtx, u: Undo, b: Extract<Beat, { k: 'move' }>, e: Effect, factor: number) {
  const from = resolve(ctx.root, b.from);
  if (!from) return;
  const ms = (e.durations.shatter ?? 0) * factor;
  const box = cardBox(ctx.root, from);
  hide(u, from);
  flash(ctx, from, ms, 0, '#ffd0d0');
  for (const [clip, fx, fy, rot] of SHARDS) {
    const piece = ghostAt(ctx, box, content(ctx, from, b.code, false), 'ghost shard');
    piece.style.clipPath = clip;
    u.nodes.push(piece);
    u.anims.push(piece.animate(
      [{ transform: 'none', opacity: 1 }, { transform: `translate(${fx * box.w}px, ${fy * box.h}px) rotate(${rot}deg)`, opacity: 0 }],
      { duration: ms, easing: 'ease-out', fill: 'both' },
    ));
  }
  flight(ctx, u, b.from, b.to, (e.durations.flight ?? 0) * factor, { code: b.code, delay: ms, scale: SHARD_GHOST_SCALE });
}

/** Banimento: a carta encolhe com fade e um brilho frio, na própria zona. */
function banish(ctx: PlayCtx, u: Undo, b: Extract<Beat, { k: 'move' }>, ms: number) {
  const from = resolve(ctx.root, b.from);
  if (!from || !isCard(from)) return;
  const g = ghostAt(ctx, cardBox(ctx.root, from), content(ctx, from, b.code, false), 'ghost banish');
  u.nodes.push(g);
  hide(u, from);
  u.anims.push(g.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.55)', opacity: 0 }], { duration: ms, easing: 'ease-in', fill: 'both' }));
}

/** Pilar de luz sobre uma zona, depois de `delay` ms. Fica por cima do tabuleiro novo e se remove ao terminar. */
function pillar(ctx: PlayCtx, at: Loc, ms: number, delay: number) {
  const el = resolve(ctx.root, at);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const h = r.height * PILLAR_ZONES;
  const p = document.createElement('div');
  p.className = 'pillar';
  Object.assign(p.style, { left: `${r.left}px`, top: `${r.bottom - h}px`, width: `${r.width}px`, height: `${h}px` });
  ctx.layer.appendChild(p);
  const anim = p.animate(
    [{ transform: 'scaleY(.05)', opacity: 0 }, { transform: 'scaleY(1)', opacity: 1, offset: 0.35 }, { transform: 'scaleY(1)', opacity: 0 }],
    { duration: ms, delay, easing: 'ease-out', fill: 'both' },
  );
  anim.finished.then(() => p.remove(), () => p.remove());
}

/**
 * Giro da carta na própria zona: 3D de verso para face (`reveal`) e/ou de 0° a 90° (mudança de posição). A carta real
 * fica escondida e um fantasma gira por cima dela até o tabuleiro novo entrar.
 */
function turnInPlace(ctx: PlayCtx, u: Undo, at: Loc, code: number, reveal: boolean, defense: boolean, ms: number) {
  const el = resolve(ctx.root, at);
  if (!el || !isZone(el)) return;
  const box = cardBox(ctx.root, el);
  const fromDeg = el.classList.contains('def') ? 90 : 0;
  // Magias e Armadilhas não giram em defesa; só monstros (zona de monstro).
  const toDeg = at.zone === 'mzone' && defense ? 90 : 0;
  hide(u, el);
  if (!reveal) {
    const face = content(ctx, el, code, false);
    const g = ghostAt(ctx, box, face);
    u.nodes.push(g);
    u.anims.push(g.animate([{ transform: `rotate(${fromDeg}deg)` }, { transform: `rotate(${toDeg}deg)` }], { duration: ms, easing: EASE_TURN, fill: 'both' }));
    return;
  }
  // Duas faces de costas uma para a outra; o fantasma gira 180° em Y (e o giro de posição junto).
  const card = document.createElement('div');
  card.className = 'flipcard';
  const b = back(); b.classList.add('flip-back');
  const f = ctx.faceOf(code) ?? back(); f.classList.add('flip-front');
  card.append(b, f);
  const g = ghostAt(ctx, box, card, 'ghost flip');
  u.nodes.push(g);
  u.anims.push(card.animate(
    [{ transform: `perspective(${PERSPECTIVE}px) rotateZ(${fromDeg}deg) rotateY(0deg)` }, { transform: `perspective(${PERSPECTIVE}px) rotateZ(${toDeg}deg) rotateY(180deg)` }],
    { duration: ms, easing: EASE_TURN, fill: 'both' },
  ));
}

/** Uma carta vai para lugar visível de todos (campo, cemitério) ou fica escondida (mão do oponente, deck)? */
const publicDest = (to: Loc) => !(to.zone === 'deck' || to.zone === 'extra' || (to.zone === 'hand' && to.p === 1));

/** Encena um beat (dentro de um grupo de simultâneos). */
function playBeat(ctx: PlayCtx, u: Undo, beat: Beat, e: Effect, factor: number) {
  const ms = (name: string) => (e.durations[name] ?? 0) * factor;
  const fade = e.kind === 'fade';
  const fly = (fromLoc: Loc | null, to: Loc, o: FlightOpts = {}) => flight(ctx, u, fromLoc, to, fade ? ms('fade') : ms('flight'), { ...o, fade });
  switch (beat.k) {
    case 'draw':
      // Uma carta por vez, com um pequeno escalonamento; o verso entra na mão.
      beat.codes.forEach((_, i) => fly({ p: beat.p, zone: 'deck', seq: 0 }, { p: beat.p, zone: 'hand', seq: 99 }, { faceDown: true, delay: i * DRAW_STAGGER * factor }));
      return;
    case 'summon':
      fly(beat.from.zone === 'none' ? null : beat.from, beat.to, { code: beat.code });
      if (e.kind === 'summon') pillar(ctx, beat.to, ms('pillar'), ms('flight'));
      return;
    case 'set':
      fly(beat.from, beat.to, { faceDown: true, endTurn: beat.to.zone === 'mzone' ? 90 : 0 });
      return;
    case 'equip':
      fly(beat.from, beat.to, { code: beat.code });
      if (e.kind === 'equip') pillar(ctx, beat.target, ms('pillar'), ms('flight'));
      return;
    case 'move':
      if (e.kind === 'shatter') shatter(ctx, u, beat, e, factor);
      else if (e.kind === 'banish') banish(ctx, u, beat, ms('fade'));
      // Volta ao deck: o fantasma vai até a placa e some.
      else fly(beat.from.zone === 'none' ? null : beat.from, beat.to, { code: beat.code, faceDown: !publicDest(beat.to), fadeOut: beat.to.zone === 'deck' || beat.to.zone === 'extra' });
      return;
    case 'attack':
      attack(ctx, u, beat, e, factor);
      return;
    case 'pos':
      if (e.kind === 'reveal' || e.kind === 'turn') turnInPlace(ctx, u, beat.at, beat.code, e.kind === 'reveal', beat.defense, ms(e.kind === 'reveal' ? 'flip' : 'turn'));
      else if (fade) turnInPlace(ctx, u, beat.at, beat.code, false, beat.defense, 0);
      return;
    default:
      return;
  }
}

/** Encena um grupo de steps simultâneos. Devolve a limpeza (remover fantasmas e mostrar as cartas reais). */
export function playGroup(group: Step[], factor: number, ctx: PlayCtx): () => void {
  const u: Undo = { nodes: [], anims: [], hidden: [] };
  for (const { beat } of group) {
    const e = effectFor(beat, { reducedMotion: ctx.reducedMotion });
    if (e.kind !== 'none') playBeat(ctx, u, beat, e, factor);
  }
  return () => {
    for (const a of u.anims) a.cancel();
    for (const n of u.nodes) n.remove();
    for (const h of u.hidden) h.style.visibility = '';
  };
}
