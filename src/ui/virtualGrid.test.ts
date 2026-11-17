import { describe, expect, it } from 'vitest';
import { gridRange, rowHeight, type GridOptions } from './virtualGrid';

const O: GridOptions = { cols: 4, gap: 8, padX: 0, border: 0, overscan: 2 };
// Largura 424: coluna (424 − 3·8)/4 = 100, célula 100 × 86/59 ≈ 145,8, linha ≈ 153,8.
const W = 424;
const rowH = rowHeight(W, O);

describe('gridRange', () => {
  it('altura da linha pela largura das colunas e a proporção da carta', () => {
    expect(rowH).toBeCloseTo(100 * 86 / 59 + 8, 5);
  });

  it('topo: monta as linhas visíveis e a folga de baixo', () => {
    const r = gridRange(6000, { width: W, height: 600, scrollTop: 0 }, O);
    // 600 / 153,8 → 4 linhas tocadas (0 a 3) + 2 de folga = 6 linhas = 24 itens
    expect(r.first).toBe(0);
    expect(r.end).toBe(24);
    expect(r.padTop).toBe(0);
    expect(r.padTop + r.padBottom + (r.end - r.first) / 4 * rowH).toBeCloseTo(1500 * rowH, 3);
  });

  it('meio: folga dos dois lados e alturas que somam a grade inteira', () => {
    const r = gridRange(6000, { width: W, height: 600, scrollTop: 100 * rowH + 10 }, O);
    expect(r.first).toBe(98 * 4);
    expect(r.end).toBe(106 * 4);
    expect(r.padTop).toBeCloseTo(98 * rowH, 5);
    expect(r.padTop + r.padBottom + (r.end - r.first) / 4 * rowH).toBeCloseTo(1500 * rowH, 3);
  });

  it('fim: a última linha incompleta entra e não sobra espaço embaixo', () => {
    const r = gridRange(6002, { width: W, height: 600, scrollTop: 1501 * rowH - 600 }, O);
    expect(r.end).toBe(6002);
    expect(r.padBottom).toBe(0);
  });

  it('lista vazia', () => {
    expect(gridRange(0, { width: W, height: 600, scrollTop: 0 }, O)).toMatchObject({ first: 0, end: 0, padTop: 0, padBottom: 0 });
  });

  it('rolagem além do fim (elástico) não passa da última linha', () => {
    const r = gridRange(40, { width: W, height: 600, scrollTop: 99999 }, O);
    expect(r.end).toBe(40);
    expect(r.padBottom).toBe(0);
  });
});
