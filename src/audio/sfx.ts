/**
 * Efeitos sonoros do duelo com Web Audio: um `AudioContext`, os arquivos decodificados uma vez e tocados como buffers
 * (sem a latência nem o limite de reprodução simultânea do `<audio>` no iOS).
 *
 * - O iOS só libera o áudio num gesto do usuário: o contexto é criado/retomado no primeiro toque (`installUnlock`).
 *   Antes disso, `play` não faz nada (e não dá erro).
 * - O mesmo som não se repete em menos de `PACING.sound.repeatMs` (`shouldPlay`); sons diferentes não se bloqueiam.
 * - O Web Audio segue a chave de silencioso do iPhone.
 */
import type { Sound as DuelSound } from '../screens/duel/anim/effects';
import { PACING } from '../screens/duel/anim/pacing';
import { rlog } from '../debug/remote';
import { music, setAudioContextSource } from './music';

/** Sons da interface (fora do duelo), como os do `SoundPlayer` do nativo. */
export type UiSound = 'tap' | 'back' | 'dialogue' | 'purchase' | 'tear' | 'rare' | 'cardAdd' | 'cardRemove';
export type Sound = DuelSound | UiSound;

/** Arquivo de cada som em `public/sounds/` (nomes do app nativo; `scripts/copy_sounds.py`). */
export const SOUND_FILES: Record<Sound, string> = {
  draw: 'draw', summon: 'summon', set: 'set', flip: 'flip', activate: 'activate', attack: 'attack', damage: 'damage',
  heal: 'heal', destroy: 'destroy', endTurn: 'end-turn', coin: 'coin-toss', victory: 'victory', defeat: 'defeat',
  tap: 'tap', back: 'back', dialogue: 'dialogue-advance', purchase: 'purchase',
  tear: 'tear', rare: 'rare', cardAdd: 'card-add', cardRemove: 'card-remove',
};
/** Volume próprio de cada som (o do nativo): o fim de turno e a compra a 0,7; os toques da interface a 0,45. */
export const SOUND_GAIN: Partial<Record<Sound, number>> = { endTurn: 0.7, purchase: 0.7, tap: 0.45, back: 0.45, dialogue: 0.45 };

/** O som pode tocar agora? Não, se o mesmo tocou há menos de `repeatMs`. Registra o toque em `last` quando pode. */
export function shouldPlay(name: Sound, now: number, last: Map<Sound, number>, repeatMs: number = PACING.sound.repeatMs): boolean {
  const prev = last.get(name);
  if (prev != null && now - prev < repeatMs) return false;
  last.set(name, now);
  return true;
}

type Ctx = AudioContext;
const AudioCtor = (): (new () => Ctx) | null =>
  (globalThis as { AudioContext?: new () => Ctx; webkitAudioContext?: new () => Ctx }).AudioContext
  ?? (globalThis as { webkitAudioContext?: new () => Ctx }).webkitAudioContext ?? null;

class Sfx {
  private ctx: Ctx | null = null;
  private buffers = new Map<Sound, AudioBuffer>();
  private last = new Map<Sound, number>();
  private loading: Promise<void> | null = null;
  private played = false;
  /** Preferência do jogador (`settings.sound`). */
  enabled = true;
  /** O contexto (depois do primeiro toque); a música passa por ele no iOS. */
  get context(): Ctx | null { return this.ctx; }

  /** Cria (ou retoma) o contexto; deve rodar dentro de um gesto do usuário. */
  unlock() {
    const C = AudioCtor();
    if (!C) return;
    const first = !this.ctx;
    if (!this.ctx) this.ctx = new C();
    const ctx = this.ctx;
    if (ctx.state === 'suspended') void ctx.resume().then(() => rlog(`áudio: retomado (${ctx.state})`), (e) => rlog(`áudio: falhou ao retomar: ${String(e)}`));
    if (first) rlog(`áudio: contexto criado no primeiro toque (${ctx.state})`);
    void this.load();
  }

  /** Baixa e decodifica todos os sons (uma vez). */
  load(): Promise<void> {
    if (!this.ctx) return Promise.resolve();
    const ctx = this.ctx;
    this.loading ??= Promise.all((Object.keys(SOUND_FILES) as Sound[]).map(async (name) => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}sounds/${SOUND_FILES[name]}.m4a`);
        if (!res.ok) return;
        this.buffers.set(name, await ctx.decodeAudioData(await res.arrayBuffer()));
      } catch (e) { rlog(`áudio: ${name} não decodificou: ${String(e)}`); }
    })).then(() => rlog(`áudio: ${this.buffers.size} sons prontos`));
    return this.loading;
  }

  /** Toca um som, opcionalmente depois de `delayMs` (ex.: o impacto do ataque). */
  play(name: Sound, delayMs = 0) {
    const ctx = this.ctx, buf = this.buffers.get(name);
    if (!this.enabled || !ctx || ctx.state !== 'running' || !buf) return;
    if (!shouldPlay(name, performance.now() + delayMs, this.last)) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = SOUND_GAIN[name] ?? 1;
    src.connect(gain).connect(ctx.destination);
    src.start(ctx.currentTime + delayMs / 1000);
    if (!this.played) { this.played = true; rlog(`áudio: primeiro som tocou (${name})`); }
  }
}

export const sfx = new Sfx();
setAudioContextSource(() => sfx.context);

/** Liga o desbloqueio do áudio (efeitos e música) ao primeiro toque/tecla (e aos seguintes, caso o iOS suspenda o contexto). */
export function installUnlock(): () => void {
  const on = () => { sfx.unlock(); music.unlock(); };
  const opts = { capture: true, passive: true } as const;
  for (const ev of ['pointerdown', 'touchend', 'keydown'] as const) document.addEventListener(ev, on, opts);
  return () => { for (const ev of ['pointerdown', 'touchend', 'keydown'] as const) document.removeEventListener(ev, on, opts); };
}
