// Mede o build de produção: tamanho do bundle (por arquivo, bruto e gzip) e da pré-carga do PWA (por pasta).
// Uso: npx vite build && node proto/measure-build.mjs [rótulo]   → acrescenta uma seção em openspec/changes/colecao-dm/medicoes.md
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = 'dist';
const OUT = 'openspec/changes/colecao-dm/medicoes.md';
const label = process.argv[2] ?? 'medição';
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

const assets = readdirSync(join(DIST, 'assets'))
  .filter((f) => /\.(js|css|wasm)$/.test(f))
  .map((f) => { const b = readFileSync(join(DIST, 'assets', f)); return { f, raw: b.length, gz: gzipSync(b).length }; })
  .sort((a, b) => b.raw - a.raw);

const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
const urls = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);
const groups = new Map();
let total = 0;
for (const u of urls) {
  const p = join(DIST, decodeURIComponent(u));
  const size = existsSync(p) ? statSync(p).size : 0;
  total += size;
  const parts = u.split('/');
  const g = parts.length > 1 ? `${parts[0]}/` : u;
  const cur = groups.get(g) ?? { n: 0, size: 0 };
  groups.set(g, { n: cur.n + 1, size: cur.size + size });
}

const lines = [
  `\n## ${label} (${new Date().toISOString().slice(0, 16).replace('T', ' ')})\n`,
  '### Bundle\n', '| Arquivo | Bruto | gzip |', '|---|---:|---:|',
  ...assets.map((a) => `| ${a.f.replace(/-[\w-]{8}\./, '.')} | ${kb(a.raw)} | ${kb(a.gz)} |`),
  `\n### Pré-carga: ${urls.length} entradas, ${mb(total)}\n`, '| Pasta | Entradas | Tamanho |', '|---|---:|---:|',
  ...[...groups].sort((a, b) => b[1].size - a[1].size).map(([g, v]) => `| ${g} | ${v.n} | ${kb(v.size)} |`),
];
if (!existsSync(OUT)) writeFileSync(OUT, '# Medições (colecao-dm)\n\nBuild de produção (`npx vite build`), pré-carga lida do `dist/sw.js`. FPS e memória no simulador do iPhone 17 Pro.\n');
appendFileSync(OUT, lines.join('\n') + '\n');
console.log(`pré-carga: ${urls.length} entradas, ${mb(total)}; maior JS: ${assets[0].f} ${kb(assets[0].raw)}`);
