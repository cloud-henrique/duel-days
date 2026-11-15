/** Motor da história: puro, sem React. O estado cabe num save (JSON). */
export type Side = 'left' | 'right' | 'center';
export type Node =
  | { t: 'say'; who?: string; name?: string; expr?: string; text: string }
  | { t: 'show'; who: string; side: Side; expr?: string }
  | { t: 'hide'; who: string }
  | { t: 'set'; flag: string; value?: boolean }
  | { t: 'if'; flag: string; then: string; else?: string }
  | { t: 'goto'; to: string }
  | { t: 'label'; name: string }
  | { t: 'choice'; options: { text: string; goto: string; set?: string }[] }
  | { t: 'heart'; who: string; delta: number }
  | { t: 'duel'; opponent: string; win: string; lose: string }
  | { t: 'end'; text?: string };

export interface Chapter { id: string; title: string; nodes: Node[] }
export interface StageSprite { id: string; expr: string; side: Side }
export interface RunState {
  chapter: string;
  i: number;
  flags: Record<string, boolean>;
  stage: StageSprite[];
  speaker: string | null;
  /** Corações ganhos nesta cena (somados ao progresso quando a cena termina). */
  gain: Record<string, number>;
}

export const newState = (ch: Chapter): RunState => settle(ch, { chapter: ch.id, i: 0, flags: {}, stage: [], speaker: null, gain: {} });

const labelIndex = (ch: Chapter, name: string) => {
  const i = ch.nodes.findIndex((n) => n.t === 'label' && n.name === name);
  if (i < 0) throw new Error(`label inexistente: ${name} (capítulo ${ch.id})`);
  return i;
};

/** Executa os nós que não pedem interação até chegar a um que pede (say, choice, duel, end). */
export function settle(ch: Chapter, st: RunState): RunState {
  let s: RunState = { ...st, flags: { ...st.flags }, stage: st.stage.map((x) => ({ ...x })), gain: { ...st.gain } };
  for (let guard = 0; guard < 1000; guard++) {
    const n = ch.nodes[s.i];
    if (!n) return { ...s, i: ch.nodes.length };
    switch (n.t) {
      case 'label': s.i++; break;
      case 'show': {
        s.stage = s.stage.filter((x) => x.id !== n.who && x.side !== n.side);
        s.stage.push({ id: n.who, expr: n.expr ?? 'neutral', side: n.side });
        s.i++; break;
      }
      case 'hide': s.stage = s.stage.filter((x) => x.id !== n.who); s.i++; break;
      case 'set': s.flags[n.flag] = n.value ?? true; s.i++; break;
      case 'heart': s.gain[n.who] = (s.gain[n.who] ?? 0) + n.delta; s.i++; break;
      case 'if': s.i = labelIndex(ch, s.flags[n.flag] ? n.then : (n.else ?? n.then)); break;
      case 'goto': s.i = labelIndex(ch, n.to); break;
      case 'say': {
        s.speaker = n.who ?? null;
        const sp = n.who && s.stage.find((x) => x.id === n.who);
        if (sp && n.expr) sp.expr = n.expr;
        return s;
      }
      default: return s; // choice, duel, end
    }
  }
  throw new Error('loop infinito na história');
}

export function advance(ch: Chapter, st: RunState): RunState {
  return settle(ch, { ...st, i: st.i + 1 });
}
export function choose(ch: Chapter, st: RunState, option: number): RunState {
  const n = ch.nodes[st.i];
  if (n?.t !== 'choice') return st;
  const o = n.options[option];
  const flags = o.set ? { ...st.flags, [o.set]: true } : st.flags;
  return settle(ch, { ...st, flags, i: labelIndex(ch, o.goto) });
}
export function resolveDuel(ch: Chapter, st: RunState, won: boolean): RunState {
  const n = ch.nodes[st.i];
  if (n?.t !== 'duel') return st;
  return settle(ch, { ...st, flags: { ...st.flags, [`won:${n.opponent}`]: won }, i: labelIndex(ch, won ? n.win : n.lose) });
}
/** Pula as falas até a próxima escolha, duelo ou fim. */
export function skip(ch: Chapter, st: RunState): RunState {
  let s = st;
  for (let guard = 0; guard < 1000 && ch.nodes[s.i]?.t === 'say'; guard++) s = advance(ch, s);
  return s;
}
export const isEnd = (ch: Chapter, st: RunState) => st.i >= ch.nodes.length || ch.nodes[st.i]?.t === 'end';
