import { describe, expect, it } from 'vitest';
import { FADE_MS, Music, type AudioLike, type MusicDeps } from './music';

/** Áudio de mentira e relógio falso: os quadros só rodam quando o teste avança o tempo. */
function setup() {
  let t = 0;
  const frames: (() => void)[] = [];
  const els = new Map<string, AudioLike & { plays: number; onerror?: () => void }>();
  const deps: MusicDeps = {
    createAudio: (url) => {
      const el = {
        loop: false, volume: 1, paused: true, plays: 0,
        play() { this.paused = false; this.plays++; }, pause() { this.paused = true; },
        addEventListener(_: 'error', cb: () => void) { this.onerror = cb; },
      } as AudioLike & { plays: number; onerror?: () => void };
      els.set(url, el);
      return el;
    },
    now: () => t,
    frame: (cb) => { frames.push(cb); },
  };
  const advance = (ms: number) => {
    const end = t + ms;
    while (t < end) { t = Math.min(end, t + 16); const f = frames.splice(0); f.forEach((cb) => cb()); }
  };
  const m = new Music(deps, '/');
  return { m, els, advance };
}

describe('música', () => {
  it('só começa depois do primeiro toque', () => {
    const { m, els } = setup();
    m.setTrack('title');
    expect(els.size).toBe(0);
    m.unlock();
    expect(els.get('/music/title.m4a')?.paused).toBe(false);
  });

  it('troca de faixa com fade: a antiga some e para, a nova entra', () => {
    const { m, els, advance } = setup();
    m.unlock(); m.setTrack('map'); advance(FADE_MS + 50);
    expect(m.levelOf('map')).toBe(1);
    expect(els.get('/music/map.m4a')!.volume).toBeCloseTo(0.6);
    m.setTrack('duel'); advance(FADE_MS / 2);
    expect(m.levelOf('map')).toBeGreaterThan(0);
    expect(m.levelOf('map')).toBeLessThan(1);
    advance(FADE_MS);
    expect(m.levelOf('duel')).toBe(1);
    expect(els.get('/music/map.m4a')!.paused).toBe(true);
  });

  it('a mesma faixa não recomeça', () => {
    const { m, els, advance } = setup();
    m.unlock(); m.setTrack('map'); advance(100);
    m.setTrack('map'); m.setTrack('map');
    expect(els.get('/music/map.m4a')!.plays).toBe(1);
  });

  it('desligada não toca; religada volta a faixa da tela; o volume vale', () => {
    const { m, els, advance } = setup();
    m.unlock(); m.setTrack('shop'); advance(FADE_MS + 50);
    m.setSettings(false, 0.6); advance(FADE_MS + 50);
    expect(els.get('/music/shop.m4a')!.paused).toBe(true);
    m.setSettings(true, 0.3); advance(FADE_MS + 50);
    expect(els.get('/music/shop.m4a')!.paused).toBe(false);
    expect(els.get('/music/shop.m4a')!.volume).toBeCloseTo(0.3);
  });

  it('segundo plano pausa e volta', () => {
    const { m, els, advance } = setup();
    m.unlock(); m.setTrack('map'); advance(FADE_MS + 50);
    m.setHidden(true); advance(FADE_MS + 50);
    expect(els.get('/music/map.m4a')!.paused).toBe(true);
    m.setHidden(false); advance(50);
    expect(els.get('/music/map.m4a')!.paused).toBe(false);
  });

  it('sem o arquivo: silêncio, sem erro', () => {
    const { m, els, advance } = setup();
    m.unlock(); m.setTrack('victory');
    els.get('/music/victory.m4a')!.onerror?.();
    m.setTrack('map'); advance(50); m.setTrack('victory'); advance(FADE_MS + 50);
    expect(els.get('/music/victory.m4a')!.plays).toBe(1);
  });
});
