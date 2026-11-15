// Percorre TODOS os caminhos do capítulo (escolhas e resultados de duelo) e valida labels e expressões.
import { readFileSync } from 'node:fs';
import { advance, choose, isEnd, newState, resolveDuel, type Chapter, type RunState } from '../src/story/runner';
import { ch1 } from '../src/story/chapters/ch1';

const chars = Object.fromEntries((JSON.parse(readFileSync('public/characters/index.json', 'utf8')).characters as { id: string; expressions: string[] }[]).map((c) => [c.id, c]));
function walk(ch: Chapter, st: RunState, trail: string[], out: string[][], seen = new Set<string>()) {
  for (let guard = 0; guard < 500; guard++) {
    if (isEnd(ch, st)) { out.push(trail); return; }
    const key = `${st.i}|${JSON.stringify(st.flags)}`;
    if (seen.has(key)) throw new Error(`ciclo em ${key}`);
    seen.add(key);
    const n = ch.nodes[st.i];
    if (n.t === 'say') {
      if (n.who) {
        if (!chars[n.who]) throw new Error(`personagem sem sprite: ${n.who}`);
        if (n.expr && !chars[n.who].expressions.includes(n.expr)) throw new Error(`${n.who} não tem a expressão ${n.expr}`);
        if (!st.stage.some((s) => s.id === n.who)) throw new Error(`${n.who} fala sem estar em cena (nó ${st.i})`);
      }
      st = advance(ch, st);
    } else if (n.t === 'choice') {
      n.options.forEach((_, i) => walk(ch, choose(ch, st, i), [...trail, `escolha${i}`], out, new Set(seen)));
      return;
    } else if (n.t === 'duel') {
      if (!chars[n.opponent]) throw new Error(`oponente sem sprite: ${n.opponent}`);
      for (const won of [true, false]) walk(ch, resolveDuel(ch, st, won), [...trail, `${n.opponent}:${won ? 'W' : 'L'}`], out, new Set(seen));
      return;
    } else throw new Error(`nó inesperado ${n.t}`);
  }
  throw new Error('passos demais');
}
const out: string[][] = [];
walk(ch1, newState(ch1), [], out);
console.log(out.length, 'caminhos válidos');
out.forEach((p) => console.log(' -', p.join(' > ')));
