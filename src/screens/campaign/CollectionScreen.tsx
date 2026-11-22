import { useEffect, useState } from 'react';
import type { CampaignState } from '../../campaign/state';
import { CardZoom } from '../../components/CardZoom';
import type { GameData } from '../../data/cards';
import { TopBar } from '../../ui/TopBar';
import { TrunkBar } from '../deck/TrunkBar';
import { TrunkGrid } from '../deck/TrunkGrid';
import { useTrunk } from '../deck/useTrunk';
import { DeckCardPanel } from '../deck/DeckCardPanel';
import { useHover, useWide } from '../../ui/wide';
import { CARD_SIZES, useCardSize } from '../../ui/cardSize';
import '../deck/deck.css';

/**
 * A Coleção (`CampaignCollectionView` do nativo): quantas cartas diferentes e quantas no total, e a mesma grade da
 * maleta do editor (ordem, filtros e busca), só para ver: o zoom não tem pôr nem tirar. Não gasta período.
 * Na tela larga (change layout-desktop-telas): a grade com o painel da carta do editor ao lado (hover mostra, clique
 * fixa, Esc solta), sem zoom, e o tamanho P/M/G.
 */
export function CollectionScreen({ s, data, onBack }: { s: CampaignState; data: GameData; onBack: () => void }) {
  const trunk = useTrunk(s, data);
  const [zoom, setZoom] = useState<number | null>(null);
  const wide = useWide();
  const hoverable = useHover() && wide;
  const [size, setSize] = useCardSize();
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => { if (!hoverable) setHover(null); }, [hoverable]);
  useEffect(() => {
    if (!wide) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wide]);
  const owned = Object.entries(s.collection).filter(([id, n]) => n > 0 && data.cards[id]);
  const total = owned.reduce((a, [, n]) => a + n, 0);
  const totals = (
    <section className="hud colltotals">
      <span className="diff"><b className="num">{owned.length}</b><small>Cartas diferentes</small></span>
      <span><b className="num">{total}</b><small>No total</small></span>
    </section>
  );
  if (wide) {
    const shown = hover ?? zoom;
    const hoverBind = hoverable ? (code: number) => ({ onPointerEnter: () => setHover(code), onPointerLeave: () => setHover((h) => (h === code ? null : h)) }) : undefined;
    return (
      <div className="app hexbg collection wide">
        <TopBar title="Coleção" onBack={onBack} />
        <div className="collbody">
          <div className="collmain">
            {totals}
            <TrunkBar sort={trunk.sort} onSort={trunk.setSort} kind={trunk.kind} onKind={trunk.setKind} query={trunk.query} onQuery={trunk.setQuery} size={size} onSize={setSize} />
            <TrunkGrid copies={trunk.copies} cards={data.cards} tiers={data.tiers} onOpen={(c) => setZoom((z) => (z === c ? null : c))} resetKey={trunk.resetKey}
              empty="Nenhuma carta encontrada." target={CARD_SIZES[size]} bind={hoverBind} onScroll={hoverable ? () => setHover(null) : undefined} />
          </div>
          <DeckCardPanel code={shown} cards={data.cards} hover={hoverable}>
            {shown != null && <p className="zoom-count num">Você tem {s.collection[shown] ?? 0}</p>}
          </DeckCardPanel>
        </div>
      </div>
    );
  }
  return (
    <div className="app hexbg collection">
      <TopBar title="Coleção" onBack={onBack} />
      {totals}
      <TrunkBar sort={trunk.sort} onSort={trunk.setSort} kind={trunk.kind} onKind={trunk.setKind} query={trunk.query} onQuery={trunk.setQuery} />
      <TrunkGrid copies={trunk.copies} cards={data.cards} tiers={data.tiers} onOpen={setZoom} resetKey={trunk.resetKey} empty="Nenhuma carta encontrada." />
      {zoom != null && <CardZoom code={zoom} cards={data.cards} onClose={() => setZoom(null)}>
        <p className="zoom-count num">Você tem {s.collection[zoom] ?? 0}</p>
      </CardZoom>}
    </div>
  );
}
