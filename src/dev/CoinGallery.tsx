/** Conferência em dev (`?coins`): moeda e dado desenhados e os textos do lance, parados e girando. */
import { useState } from 'react';
import { Coin, Die } from '../ui/coin';
import { Toss } from '../screens/duel/anim/Toss';
import '../screens/duel/duel.css';

export function CoinGallery() {
  const [k, setK] = useState(0);
  const who = () => 'Ana';
  return (
    <div className="hexbg" style={{ minHeight: '100%', padding: 16, display: 'grid', gap: 18, justifyItems: 'center' }}>
      <button className="hud-btn primary" onClick={() => setK((x) => x + 1)}>Girar de novo</button>
      <div style={{ display: 'flex', gap: 16 }}>
        <Coin side="heads" spinMs={900} spinKey={k} /><Coin side="tails" spinMs={900} spinKey={k} /><Coin side="tails" spinMs={0} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5, 6].map((n) => <Die key={n} value={n} spinMs={n === 4 ? 900 : 0} spinKey={k} size={52} />)}
      </div>
      {([['heads', [0]], ['tails', [0]]] as const).map(([call, results], i) => (
        <div key={i} style={{ position: 'relative', width: 340, height: 260, border: '1px dashed #2f7fd8' }}>
          <Toss t={{ what: 'coin', p: 0, results: [...results], call, key: k * 10 + i, spinMs: 900, captionMs: 400 }} who={who} />
        </div>
      ))}
    </div>
  );
}
