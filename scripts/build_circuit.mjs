// Gera src/ui/circuit.svg: o padrão de "circuito" do fundo, como o CircuitPattern do app nativo (GameBackground.swift):
// uma grade de hexágonos em pé (raio 30) e, saindo de um canto de alguns deles, uma trilha que dobra a 45° e termina num
// ponto de solda. Desenho próprio (sem arte de terceiros). O ladrilho repete sem emenda: 10 fileiras × 5 colunas.
// Uso: node scripts/build_circuit.mjs
import { writeFileSync } from 'node:fs';

const R = 30, W = R * Math.sqrt(3), STEP = R * 1.5, ROWS = 10, COLS = 5;
const TW = W * COLS, TH = STEP * ROWS;
const f = (n) => +n.toFixed(2);
let hex = '', traces = '', pads = '';
// Desenha uma fileira a mais em cima e embaixo e uma coluna a mais dos lados, para os hexágonos cortados na borda
// fecharem com os do ladrilho vizinho.
for (let row = -1; row <= ROWS; row++) {
  for (let col = -1; col <= COLS; col++) {
    const x = col * W + (((row % 2) + 2) % 2 ? W / 2 : 0), y = row * STEP;
    const corners = Array.from({ length: 6 }, (_, i) => { const a = (i * Math.PI) / 3 - Math.PI / 2; return [x + R * Math.cos(a), y + R * Math.sin(a)]; });
    hex += `M${corners.map(([a, b]) => `${f(a)} ${f(b)}`).join('L')}Z`;
    const r = ((row % ROWS) + ROWS) % ROWS, c = ((col % COLS) + COLS) % COLS;
    if ((r * 7 + c * 13) % 5 === 0) {
      const [sx, sy] = corners[(r + c) % 5];
      const bx = sx + R * 0.6, ex = bx + R * 0.4, ey = sy + R * 0.4;
      traces += `M${f(sx)} ${f(sy)}H${f(bx)}L${f(ex)} ${f(ey)}`;
      pads += `<circle cx="${f(ex)}" cy="${f(ey)}" r="2.5"/>`;
    }
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f(TW)}" height="${f(TH)}" viewBox="0 0 ${f(TW)} ${f(TH)}">`
  + `<path d="${hex}" fill="none" stroke="#2ab8ff" stroke-opacity=".1" stroke-width="1"/>`
  + `<path d="${traces}" fill="none" stroke="#2ab8ff" stroke-opacity=".18" stroke-width="1.2"/>`
  + `<g fill="#2ab8ff" fill-opacity=".24">${pads}</g></svg>\n`;
writeFileSync(new URL('../src/ui/circuit.svg', import.meta.url), svg);
console.log(`src/ui/circuit.svg: ladrilho ${f(TW)}×${f(TH)}, ${svg.length} bytes`);
