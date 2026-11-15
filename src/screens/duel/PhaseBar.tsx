import { phaseChips } from './prompt';

/** Barra de fases no centro do campo: turno, um chip por fase e, abaixo, o último acontecimento (narrador). */
export function PhaseBar({ turn, phase, narration }: { turn: number; phase: number; narration: string }) {
  return (
    <div className="phasebar hud">
      <div className="chips"><b className="tn num">T{turn}</b>{phaseChips(phase).map((c) => <span key={c.label} className={`chip${c.on ? ' on' : ''}`}>{c.label}</span>)}</div>
      <div className="narr" aria-live="polite"><span key={narration}>{narration}</span></div>
    </div>
  );
}
