// Percorre TODOS os caminhos de TODAS as cenas (escolhas e resultados de duelo) e valida labels, sprites e expressões.
import { readFileSync } from 'node:fs';
import { advance, choose, isEnd, newState, resolveDuel, type Chapter, type RunState } from '../src/story/runner';
import { LOCATIONS, SCENES, pickScene } from '../src/story/world';
import { newProgress } from '../src/story/progress';

const chars = Object.fromEntries((JSON.parse(readFileSync('public/characters/index.json', 'utf8')).characters as { id: string; expressions: string[] }[]).map((c) => [c.id, c]));
let paths = 0;
function walk(ch: Chapter, st: RunState, seen = new Set<string>()) {
  for (let guard = 0; guard < 500; guard++) {
    if (isEnd(ch, st)) { paths++; return; }
    const key = `${st.i}|${JSON.stringify(st.flags)}`;
    if (seen.has(key)) throw new Error(`${ch.id}: ciclo em ${key}`);
    seen.add(key);
    const n = ch.nodes[st.i];
    if (n.t === 'say') {
      if (n.who) {
        const c = chars[n.who];
        if (!c) throw new Error(`${ch.id}: personagem sem sprite: ${n.who}`);
        if (n.expr && !c.expressions.includes(n.expr)) throw new Error(`${ch.id}: ${n.who} não tem a expressão ${n.expr}`);
        if (!st.stage.some((s) => s.id === n.who)) throw new Error(`${ch.id}: ${n.who} fala sem estar em cena (nó ${st.i})`);
      }
      st = advance(ch, st);
    } else if (n.t === 'choice') {
      n.options.forEach((_, i) => walk(ch, choose(ch, st, i), new Set(seen)));
      return;
    } else if (n.t === 'duel') {
      if (!chars[n.opponent]) throw new Error(`${ch.id}: oponente sem sprite: ${n.opponent}`);
      for (const won of [true, false]) walk(ch, resolveDuel(ch, st, won), new Set(seen));
      return;
    } else throw new Error(`${ch.id}: nó inesperado ${n.t}`);
  }
  throw new Error(`${ch.id}: passos demais`);
}

for (const s of SCENES) {
  if (!LOCATIONS.some((l) => l.id === s.location)) throw new Error(`${s.id}: local inexistente ${s.location}`);
  if (!LOCATIONS.find((l) => l.id === s.location)!.chars.includes(s.char)) throw new Error(`${s.id}: ${s.char} não está em ${s.location}`);
  walk(s.chapter, newState(s.chapter));
}

// Seleção de cena: intro -> (4 corações) vínculo -> revanche
for (const l of LOCATIONS) for (const c of l.chars) {
  const p = newProgress('Teste');
  const a = pickScene(c, p).id;
  p.seen.push(a); p.hearts[c] = 4;
  const b = pickScene(c, p).id;
  p.seen.push(b);
  const r = pickScene(c, p).id;
  console.log(`${c}: ${a} -> ${b} -> ${r}`);
  if (!a.endsWith('_intro') || !b.endsWith('_bond') || !r.endsWith('_rematch')) throw new Error(`ordem de cenas errada para ${c}`);
}
console.log(SCENES.length, 'cenas,', paths, 'caminhos válidos');
