import { useState } from 'react';
import type { CampaignState } from '../../campaign/state';
import { CardZoom } from '../../components/CardZoom';
import type { GameData } from '../../data/cards';
import { TopBar } from '../../ui/TopBar';
import { TrunkBar } from '../deck/TrunkBar';
import { TrunkGrid } from '../deck/TrunkGrid';
import { useTrunk } from '../deck/useTrunk';
import '../deck/deck.css';

/**
 * A Coleção (`CampaignCollectionView` do nativo): quantas cartas diferentes e quantas no total, e a mesma grade da
 * maleta do editor (ordem, filtros e busca), só para ver: o zoom não tem pôr nem tirar. Não gasta período.
 */
export function CollectionScreen({ s, data, onBack }: { s: CampaignState; data: GameData; onBack: () => void }) {
  const trunk = useTrunk(s, data);
  const [zoom, setZoom] = useState<number | null>(null);
  const owned = Object.entries(s.collection).filter(([id, n]) => n > 0 && data.cards[id]);
  const total = owned.reduce((a, [, n]) => a + n, 0);
  return (
    <div className="app hexbg collection">
      <TopBar title="Coleção" onBack={onBack} />
      <section className="hud colltotals">
        <span className="diff"><b className="num">{owned.length}</b><small>Cartas diferentes</small></span>
        <span><b className="num">{total}</b><small>No total</small></span>
      </section>
      <TrunkBar sort={trunk.sort} onSort={trunk.setSort} kind={trunk.kind} onKind={trunk.setKind} query={trunk.query} onQuery={trunk.setQuery} />
      <TrunkGrid copies={trunk.copies} cards={data.cards} tiers={data.tiers} onOpen={setZoom} resetKey={trunk.resetKey} empty="Nenhuma carta encontrada." />
      {zoom != null && <CardZoom code={zoom} cards={data.cards} onClose={() => setZoom(null)}>
        <p className="zoom-count num">Você tem {s.collection[zoom] ?? 0}</p>
      </CardZoom>}
    </div>
  );
}
