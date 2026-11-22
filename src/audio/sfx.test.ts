import { describe, expect, it } from 'vitest';
import { SOUND_FILES, setAmbientSession, shouldPlay } from './sfx';
import type { Sound } from './sfx';
import { PACING } from '../screens/duel/anim/pacing';

describe('shouldPlay', () => {
  it('o mesmo som não se repete em menos de 60ms', () => {
    const last = new Map<Sound, number>();
    expect(PACING.sound.repeatMs).toBe(60);
    expect(shouldPlay('draw', 1000, last)).toBe(true);
    expect(shouldPlay('draw', 1030, last)).toBe(false);
    expect(shouldPlay('draw', 1059, last)).toBe(false);
    expect(shouldPlay('draw', 1060, last)).toBe(true);
  });

  it('sons diferentes não se bloqueiam', () => {
    const last = new Map<Sound, number>();
    expect(shouldPlay('draw', 1000, last)).toBe(true);
    expect(shouldPlay('summon', 1001, last)).toBe(true);
    expect(shouldPlay('attack', 1002, last)).toBe(true);
  });

  it('um toque recusado não adia o próximo', () => {
    const last = new Map<Sound, number>();
    shouldPlay('damage', 0, last);
    shouldPlay('damage', 50, last);
    expect(shouldPlay('damage', 60, last)).toBe(true);
  });
});

describe('SOUND_FILES', () => {
  it('cobre os 13 sons do duelo e os 8 da interface, com nomes de arquivo distintos', () => {
    const files = Object.values(SOUND_FILES);
    expect(files).toHaveLength(21);
    expect(new Set(files).size).toBe(21);
  });
});

describe('setAmbientSession', () => {
  it('põe a sessão em ambient quando o Safari tem a Audio Session API', () => {
    const nav = { audioSession: { type: 'auto' } };
    expect(setAmbientSession(nav)).toBe(true);
    expect(nav.audioSession.type).toBe('ambient');
  });
  it('sem a API (outros navegadores), não faz nada', () => {
    expect(setAmbientSession({})).toBe(false);
    expect(setAmbientSession(undefined)).toBe(false);
  });
});
