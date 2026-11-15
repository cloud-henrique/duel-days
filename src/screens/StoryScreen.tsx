import { useEffect, useState } from 'react';
import type { Chapter, RunState } from '../story/runner';

export interface CharInfo { id: string; name: string; body: { w: number; h: number }; face: { x: number; y: number; w: number; h: number }; expressions: string[] }
const BASE = import.meta.env.BASE_URL;

function Sprite({ c, expr, side, active }: { c: CharInfo; expr: string; side: 'left' | 'right'; active: boolean }) {
  const e = c.expressions.includes(expr) ? expr : 'neutral';
  const { face: f, body: b } = c;
  return (
    <div className={`sprite ${side}${active ? ' on' : ''}`} style={{ aspectRatio: `${b.w} / ${b.h}` }}>
      <img src={`${BASE}characters/${c.id}/body.webp`} alt="" draggable={false} />
      <img className="face" src={`${BASE}characters/${c.id}/${e}.webp`} alt="" draggable={false}
        style={{ left: `${(f.x / b.w) * 100}%`, top: `${(f.y / b.h) * 100}%`, width: `${(f.w / b.w) * 100}%` }} />
    </div>
  );
}

export function StoryScreen({ chapter, state, chars, onNext, onChoose, onMenu }: {
  chapter: Chapter; state: RunState; chars: Record<string, CharInfo>;
  onNext: () => void; onChoose: (i: number) => void; onMenu: () => void;
}) {
  const node = chapter.nodes[state.i];
  const text = node?.t === 'say' ? node.text : '';
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    if (!text) return;
    const id = setInterval(() => setShown((n) => (n >= text.length ? n : n + 1)), 22);
    return () => clearInterval(id);
  }, [state.i, text]);

  const tap = () => { if (node?.t !== 'say') return; shown < text.length ? setShown(text.length) : onNext(); };

  return (
    <div className="story" onClick={tap}>
      <div className="stage">
        {state.stage.map((s) => chars[s.id] && <Sprite key={s.id} c={chars[s.id]} expr={s.expr} side={s.side} active={state.speaker === s.id} />)}
      </div>
      {node?.t === 'say' && (
        <div className="dialog">
          {node.name && <div className="nametag">{node.name}</div>}
          <p>{text.slice(0, shown)}</p>
          {shown >= text.length && <span className="more">▼</span>}
        </div>
      )}
      {node?.t === 'choice' && (
        <div className="dialog choices" onClick={(e) => e.stopPropagation()}>
          {node.options.map((o, i) => <button key={i} onClick={() => onChoose(i)}>{o.text}</button>)}
        </div>
      )}
      {(!node || node.t === 'end') && (
        <div className="dialog choices" onClick={(e) => e.stopPropagation()}>
          <p>{node?.t === 'end' && node.text ? node.text : 'Fim'}</p>
          <button className="primary" onClick={onMenu}>Voltar ao menu</button>
        </div>
      )}
      <button className="menu-btn" onClick={(e) => { e.stopPropagation(); onMenu(); }}>☰</button>
    </div>
  );
}
