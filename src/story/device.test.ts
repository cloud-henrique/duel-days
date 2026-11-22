import { describe, expect, it } from 'vitest';
import { deviceLabel } from './device';

describe('rótulo do aparelho', () => {
  it.each([
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15', 0, 'iPhone'],
    ['Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 5, 'iPad'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari', 5, 'iPad'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130', 0, 'Mac'],
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari', 5, 'Android'],
    ['Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/130 Safari', 5, 'Tablet Android'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130', 0, 'Windows'],
    ['Mozilla/5.0 (X11; CrOS x86_64 14541.0.0)', 0, 'Chromebook'],
    ['Mozilla/5.0 (X11; Linux x86_64) Firefox/130', 0, 'Linux'],
    ['curl/8', 0, 'Outro aparelho'],
  ])('%s', (ua, touch, label) => { expect(deviceLabel(ua, touch)).toBe(label); });
});
