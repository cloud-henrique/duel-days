/**
 * Música de fundo (change `campanha-dm`): uma faixa em laço por tela, como no app nativo. Cada faixa é um `<audio loop>`
 * (streaming, sem decodificar megabytes na memória); a troca é com fade, e a mesma faixa não recomeça.
 *
 * - No iOS o `volume` do `<audio>` é só leitura: com o `AudioContext` dos efeitos liberado, a faixa passa por um
 *   `GainNode` e o volume e o fade são feitos nele.
 * - O áudio só toca depois do primeiro toque (`unlock`, chamado pelo `installUnlock` dos efeitos).
 * - Com o app em segundo plano, a música para; volta ao retornar.
 * - Sem o arquivo (as faixas não são versionadas), a faixa fica em silêncio, sem erro.
 */
export type Track = 'title' | 'map' | 'shop' | 'encounter' | 'duel' | 'boss-duel' | 'victory' | 'defeat';

export const FADE_MS = 600;

export interface AudioLike {
  loop: boolean;
  volume: number;
  paused: boolean;
  play(): Promise<void> | void;
  pause(): void;
  addEventListener(ev: 'error', cb: () => void): void;
}

export interface MusicDeps {
  createAudio(url: string): AudioLike;
  now(): number;
  frame(cb: () => void): void;
  /** Liga o elemento a um ganho do Web Audio (iOS); devolve o ajuste de ganho, ou null para usar `volume`. */
  route?(el: AudioLike): ((v: number) => void) | null;
}

interface Voice { el: AudioLike; level: number; from: number; to: number; start: number; broken: boolean; setGain: ((v: number) => void) | null }

export class Music {
  private voices = new Map<Track, Voice>();
  private wanted: Track | null = null;
  private unlocked = false;
  private hidden = false;
  private ticking = false;
  enabled = true;
  volume = 0.6;

  constructor(private deps: MusicDeps, private base = '') {}

  /** A faixa da tela atual (null = silêncio). A mesma faixa não recomeça. */
  setTrack(t: Track | null) { if (t !== this.wanted) { this.wanted = t; this.apply(); } }
  setSettings(enabled: boolean, volume: number) { this.enabled = enabled; this.volume = volume; this.apply(); }
  setHidden(hidden: boolean) { this.hidden = hidden; this.apply(); }
  /** Chamado num gesto do usuário (o iOS só deixa o áudio começar assim). */
  unlock() { this.unlocked = true; this.apply(); }

  get current(): Track | null { return this.target(); }
  levelOf(t: Track) { return this.voices.get(t)?.level ?? 0; }
  isPlaying(t: Track) { const v = this.voices.get(t); return !!v && !v.el.paused; }

  private target(): Track | null { return this.enabled && this.unlocked && !this.hidden ? this.wanted : null; }

  private voice(t: Track): Voice {
    let v = this.voices.get(t);
    if (!v) {
      const el = this.deps.createAudio(`${this.base}music/${t}.m4a`);
      el.loop = true;
      el.volume = 0;
      v = { el, level: 0, from: 0, to: 0, start: 0, broken: false, setGain: this.deps.route?.(el) ?? null };
      const voice = v;
      el.addEventListener('error', () => { voice.broken = true; });
      this.voices.set(t, v);
    }
    return v;
  }

  private apply() {
    const target = this.target();
    const now = this.deps.now();
    if (target) {
      const v = this.voice(target);
      if (!v.broken) {
        if (v.to !== 1) Object.assign(v, { from: v.level, to: 1, start: now });
        if (v.el.paused) { try { void Promise.resolve(v.el.play()).catch(() => {}); } catch { /* sem áudio */ } }
      }
    }
    for (const [t, v] of this.voices) if (t !== target && v.to !== 0) Object.assign(v, { from: v.level, to: 0, start: now });
    this.render();
    if (!this.ticking) { this.ticking = true; this.deps.frame(() => this.tick()); }
  }

  /** Avança os fades; continua a cada quadro enquanto alguma faixa não chegou ao alvo. */
  tick() {
    this.ticking = false;
    const now = this.deps.now();
    let moving = false;
    for (const v of this.voices.values()) {
      const p = Math.min(1, (now - v.start) / FADE_MS);
      v.level = v.from + (v.to - v.from) * p;
      if (p < 1) moving = true;
      else if (v.to === 0 && !v.el.paused) v.el.pause();
    }
    this.render();
    if (moving) { this.ticking = true; this.deps.frame(() => this.tick()); }
  }

  private render() {
    for (const v of this.voices.values()) {
      const vol = Math.max(0, Math.min(1, v.level * this.volume));
      if (v.setGain) { v.setGain(vol); v.el.volume = 1; } else v.el.volume = vol;
    }
  }
}

type Ctx = AudioContext;
let ctxRef: (() => Ctx | null) | null = null;
/** O `AudioContext` dos efeitos, para o roteamento no iOS (definido pelo `sfx`). */
export const setAudioContextSource = (f: () => Ctx | null) => { ctxRef = f; };

const browserDeps: MusicDeps = {
  createAudio: (url) => {
    const el = new Audio(url);
    el.preload = 'auto';
    el.crossOrigin = 'use-credentials';
    return el;
  },
  now: () => performance.now(),
  frame: (cb) => requestAnimationFrame(cb),
  route: (el) => {
    const ctx = ctxRef?.();
    if (!ctx || !(el instanceof HTMLMediaElement)) return null;
    try {
      const gain = ctx.createGain();
      ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
      return (v) => { gain.gain.value = v; };
    } catch { return null; }
  },
};

export const music = new Music(browserDeps, typeof import.meta !== 'undefined' ? import.meta.env?.BASE_URL ?? '/' : '/');

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => music.setHidden(document.visibilityState === 'hidden'));
}
