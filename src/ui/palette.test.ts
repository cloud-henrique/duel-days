import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Paleta azul em tokens (change paleta-mais-clara): os azuis escuros só existem nas declarações do `:root` do
// styles.css; as telas usam os papéis (--bg, --panel, --mat...). Fora: a face das cartas e o véu dos diálogos (.scrim).

const cssFiles = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? cssFiles(join(dir, e.name)) : e.name.endsWith('.css') ? [join(dir, e.name)] : []);
const FILES = [...cssFiles('src'), 'src/screens/campaign/assets.ts'].filter((f) => !f.endsWith('cardface.css')).sort();

function rgbOf(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    const h = color.slice(1);
    const full = h.length <= 4 ? h.slice(0, 3).split('').map((c) => c + c).join('') : h.slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
  }
  return color.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number) as [number, number, number];
}

/** Azul escuro: o canal azul domina e nenhum canal passa de 0x90 (o marinho de antes e os tons vizinhos). */
export function isDarkBlue(color: string): boolean {
  const [r, g, b] = rgbOf(color);
  return b >= r + 16 && b >= g && Math.max(r, g, b) < 0x90;
}

/** As cores azuis escuras soltas de um arquivo (sem comentários, sem o `:root` e sem o `.scrim`). */
export function strayDarkBlues(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    .replace(/:root\s*\{[^}]*\}/g, '').replace(/\.scrim\s*\{[^}]*\}/g, '');
  const colors = code.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
  return colors.filter((c) => (!c.startsWith('#') || [3, 4, 6, 8].includes(c.length - 1)) && isDarkBlue(c));
}

describe('paleta azul em tokens', () => {
  it('reconhece o marinho de antes e deixa o resto', () => {
    expect(['#050a18', '#0a1a3a', '#123062', 'rgba(5,12,31,.88)', 'rgba(10, 52, 84, .96)'].every(isDarkBlue)).toBe(true);
    expect(['#2ab8ff', '#f2c14e', '#3a2a45', '#000a', '#e8f1ff', 'rgba(42,184,255,.45)'].some(isDarkBlue)).toBe(false);
  });

  it('ignora o :root, o .scrim e os comentários', () => {
    expect(strayDarkBlues(':root { --bg: #050a18; }\n.scrim { background: rgba(2,6,18,.72); }\n/* #0a1a3a */ .a { color: #fff; }')).toEqual([]);
    expect(strayDarkBlues('.a { background: #0a1a3a; }')).toEqual(['#0a1a3a']);
  });

  it('cores de tema do PWA iguais ao fundo (o degrau da escala que o --bg usa)', () => {
    const css = readFileSync('src/styles.css', 'utf8');
    const step = css.match(/--bg:\s*var\((--navy-\d)\)/)![1];
    const bg = css.match(new RegExp(`${step}:\\s*(#[0-9a-fA-F]{6})`))![1].toLowerCase();
    expect(readFileSync('index.html', 'utf8').match(/name="theme-color" content="(#[0-9a-fA-F]{6})"/)![1].toLowerCase()).toBe(bg);
    const vite = readFileSync('vite.config.ts', 'utf8');
    expect(vite.match(/theme_color: '(#[0-9a-fA-F]{6})'/)![1].toLowerCase()).toBe(bg);
    expect(vite.match(/background_color: '(#[0-9a-fA-F]{6})'/)![1].toLowerCase()).toBe(bg);
  });

  it.each(FILES)('%s sem azul escuro solto', (file) => {
    expect(strayDarkBlues(readFileSync(file, 'utf8'))).toEqual([]);
  });
});
