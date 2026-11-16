import { useEffect, useState } from 'react';
import { MAX_HEARTS } from '../story/progress';
import type { Chapter, RunState } from '../story/runner';
import { GameIcon } from '../ui/icons';

export interface CharInfo { id: string; name: string; body: { w: number; h: number }; face: { x: number; y: number; w: number; h: number }; expressions: string[] }
const BASE = import.meta.env.BASE_URL;

function Sprite({ c, expr, side, active }: { c: CharInfo; expr: string; side: 'left' | 'right' | 'center'; active: boolean }) {
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

export interface StoryHeader { place: string; sub: string; hearts: number }

export function StoryScreen({ chapter, state, chars, playerName, header, bg, onNext, onChoose, onSkip, onFinish, onTitle }: {
  chapter: Chapter; state: RunState; chars: Record<string, CharInfo>; playerName: string; header: StoryHeader; bg: string;
  onNext: () => void; onChoose: (i: number) => void; onSkip: () => void; onFinish: () => void; onTitle: () => void;
}) {
  const tr = (s: string) => s.replace(/\{nome\}/g, playerName);
  const node = chapter.nodes[state.i];
  const text = node?.t === 'say' ? tr(node.text) : '';
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    if (!text) return;
    const id = setInterval(() => setShown((n) => (n >= text.length ? n : n + 1)), 22);
    return () => clearInterval(id);
  }, [state.i, text]);

  const done = !node || node.t === 'end';
  const tap = () => { if (node?.t !== 'say') return; if (shown < text.length) setShown(text.length); else onNext(); };

  return (
    <div className="story hexbg">
      <div className="story-bg" style={{ background: bg }} />
      <div className="shead">
        <div className="place hud"><b>{header.place}</b><span>{header.sub}</span></div>
        <div className="hearts hud">{Array.from({ length: MAX_HEARTS }, (_, i) => <span key={i} className={`heart${i < header.hearts ? '' : ' off'}`}><GameIcon name="heart" size={20} /></span>)}</div>
      </div>
      <div className="stage">
        {state.stage.map((s) => chars[s.id] && <Sprite key={s.id} c={chars[s.id]} expr={s.expr} side={s.side} active={state.speaker === s.id} />)}
      </div>
      {node?.t === 'say' && (
        <>
          {/* Área de toque para avançar: <button> porque o iOS não entrega toques a <div>. */}
          <button type="button" className="tapzone" aria-label="Avançar" onClick={tap} />
          <button className="hud-btn skip" onClick={(e) => { e.stopPropagation(); onSkip(); }}><GameIcon name="skip" /> Pular</button>
          <div className="dialog">
            {node.name && <div className="nametag">{tr(node.name)}</div>}
            <p>{text.slice(0, shown)}</p>
            {shown >= text.length && <span className="more"><GameIcon name="next" size={16} /></span>}
          </div>
        </>
      )}
      {node?.t === 'choice' && (
        <div className="dialog choices" onClick={(e) => e.stopPropagation()}>
          {node.options.map((o, i) => <button key={i} className="hud-btn primary" onClick={() => onChoose(i)}>{tr(o.text)}</button>)}
        </div>
      )}
      {done && (
        <div className="dialog choices" onClick={(e) => e.stopPropagation()}>
          <button className="hud-btn gold" onClick={onFinish}>Voltar ao mapa</button>
        </div>
      )}
      <button className="hud-btn menu-btn" onClick={(e) => { e.stopPropagation(); onTitle(); }} aria-label="Menu"><GameIcon name="menu" size={22} /></button>
    </div>
  );
}
