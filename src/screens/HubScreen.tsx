import { LOCATIONS, heartsOf } from '../story/world';
import { MAX_HEARTS, type Progress } from '../story/progress';
import type { CharInfo } from './StoryScreen';

const BASE = import.meta.env.BASE_URL;

export function HubScreen({ progress, chars, onPick, onTitle }: { progress: Progress; chars: Record<string, CharInfo>; onPick: (char: string) => void; onTitle: () => void }) {
  return (
    <div className="app hub hexbg">
      <div className="hubtop">
        <div><div className="stats">MAPA</div><b className="hubname">{progress.playerName}</b></div>
        <button className="hud-btn" onClick={onTitle}>☰</button>
      </div>
      <div className="hublist">
        {LOCATIONS.map((loc) => (
          <section key={loc.id} className="loc hud" style={{ backgroundImage: `${loc.bg}` }}>
            <h3>{loc.name}</h3>
            <p>{loc.blurb}</p>
            <div className="locchars">
              {loc.chars.map((id) => {
                const wins = progress.wins[id] ?? 0;
                const h = heartsOf(progress, id);
                return (
                  <button key={id} className="charchip" onClick={() => onPick(id)}>
                    <img src={`${BASE}characters/${id}/neutral.webp`} alt="" />
                    <span className="cn">{chars[id]?.name ?? id}</span>
                    <span className="hs">{Array.from({ length: MAX_HEARTS }, (_, i) => <i key={i} className={i < h ? '' : 'off'}>♥</i>)}</span>
                    <span className="stats">{wins === 0 ? 'nenhuma vitória' : `${wins} vitória${wins > 1 ? 's' : ''}`}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
