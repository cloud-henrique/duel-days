import { useState } from 'react';
import { CardSheet, art } from '../components/CardSheet';
import type { GameData } from '../data/cards';
import { PACK_PRICE } from '../game/economy';
import { PACK_SIZE, TIER_NAME, openPack, type Pulled } from '../game/packs';
import type { Progress } from '../story/progress';

interface Result { pulls: (Pulled & { isNew: boolean })[]; packs: number }

export function ShopScreen({ progress, data, onChange, onBack }: { progress: Progress; data: GameData; onChange: (p: Progress) => void; onBack: () => void }) {
  const { cards, tiers } = data;
  const [result, setResult] = useState<Result | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);

  const buy = (n: number) => {
    const cost = n * PACK_PRICE;
    if (progress.coins < cost) return;
    const collection = { ...progress.collection };
    const pulls: Result['pulls'] = [];
    for (let k = 0; k < n; k++)
      for (const p of openPack(tiers)) { pulls.push({ ...p, isNew: !collection[p.code] }); collection[p.code] = (collection[p.code] ?? 0) + 1; }
    onChange({ ...progress, coins: progress.coins - cost, collection });
    setResult({ pulls, packs: n });
  };

  if (result) {
    const novas = result.pulls.filter((p) => p.isNew).length;
    return (
      <div className="app deckb hexbg">
        <div className="hubtop"><b className="hubname">Resumo da caixa</b><span className="stats">{result.packs} pack{result.packs > 1 ? 's' : ''}</span></div>
        <p className="summary">{novas} carta(s) nova(s) na coleção!</p>
        <div className="cardgrid">
          {result.pulls.map((p, i) => (
            <button key={i} className={`cell r-${p.tier} pop`} style={{ animationDelay: `${Math.min(i, 24) * 60}ms` }} onClick={() => setZoom(p.code)}>
              <img src={art(p.code, 'small')} alt={cards[p.code]?.name ?? ''} draggable={false} />
              {p.isNew && <em className="nova">NOVA</em>}
            </button>
          ))}
        </div>
        <button className="hud-btn primary" style={{ flexShrink: 0 }} onClick={() => setResult(null)}>✓ Pronto</button>
        {zoom != null && <CardSheet code={zoom} cards={cards} onClose={() => setZoom(null)} />}
      </div>
    );
  }

  return (
    <div className="app deckb hexbg">
      <div className="hubtop">
        <button className="hud-btn" onClick={onBack}>←</button>
        <b className="hubname">Loja</b>
        <span className="coins">◎ {progress.coins}</span>
      </div>
      <section className="pack hud">
        <div className="packart"><span>DUEL</span><span>MONSTERS</span><small>{Object.keys(tiers).length} cartas</small></div>
        <p>Cada pack tem {PACK_SIZE} cartas, com pelo menos 1 rara garantida.</p>
        <div className="odds stats">{`Normal 61% · ${TIER_NAME.R} 28% · ${TIER_NAME.SR} 9% · ${TIER_NAME.UR} 2%`}</div>
        <div className="acts">
          <button className="hud-btn primary" disabled={progress.coins < PACK_PRICE} onClick={() => buy(1)}>Abrir 1 · ◎ {PACK_PRICE}</button>
          <button className="hud-btn primary" disabled={progress.coins < PACK_PRICE * 5} onClick={() => buy(5)}>Abrir 5 · ◎ {PACK_PRICE * 5}</button>
        </div>
      </section>
      <p className="stats" style={{ textAlign: 'center' }}>Ganhe moedas vencendo duelos.</p>
    </div>
  );
}
