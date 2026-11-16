import { useState } from 'react';
import { CardSheet, art } from '../components/CardSheet';
import type { GameData } from '../data/cards';
import type { Rarity } from '../campaign/data/types';
import {
  boxPrice, buy, buyBox, canBuy, characterListing, collectionListing, missingDP, openUnopened, packByKey, price,
  type Lock, type PackOpening, type ShopEntry,
} from '../campaign/packs';
import type { CampaignState } from '../campaign/state';
import { GameIcon } from '../ui/icons';
import { Dp } from '../ui/Dp';
import { packImage } from './campaign/assets';

const TIER_CLASS: Record<Rarity, string> = { common: 'N', rare: 'R', super: 'SR', ultra: 'UR' };
const lockText = (l: Lock) => (l.kind === 'day' ? `Dia ${l.day}` : `${l.wins}/${l.goal}`);
const lockHint = (l: Lock) => (l.kind === 'day' ? `Chega à loja no dia ${l.day}` : `Vença ${l.name} ${l.goal} vezes`);

/**
 * Loja da campanha (Loja de Jogos do Vovô), com o visual de antes: pacotes ganhos para abrir, coleções à venda (e a
 * próxima, bloqueada com o dia), pacotes de personagem (liberados com 5 vitórias) e a caixa de 20. Não gasta período.
 */
export function ShopScreen({ campaign: s, data, onChange, onBack }: {
  campaign: CampaignState; data: GameData; onChange: (s: CampaignState) => void; onBack: () => void;
}) {
  const { cards } = data;
  const [result, setResult] = useState<{ openings: PackOpening[]; title: string } | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);

  const doOpenUnopened = () => { const r = openUnopened(s); onChange(r.state); setResult({ openings: [r.opening], title: 'Pacote ganho' }); };
  const doBuy = (key: string) => { const r = buy(s, key); onChange(r.state); setResult({ openings: [r.opening], title: packByKey(key)?.name ?? '' }); };
  const doBox = (key: string) => { const r = buyBox(s, key); onChange(r.state); setResult({ openings: r.openings, title: `Caixa: ${packByKey(key)?.name ?? ''}` }); };

  if (result) {
    const pulls = result.openings.flatMap((o) => o.pulls);
    const novas = pulls.filter((p) => p.isNew).length;
    return (
      <div className="app deckb hexbg">
        <div className="hubtop"><b className="hubname">{result.title}</b><span className="stats">{result.openings.length} pacote{result.openings.length > 1 ? 's' : ''}</span></div>
        <p className="summary">{novas ? `${novas} carta${novas > 1 ? 's' : ''} nova${novas > 1 ? 's' : ''} na coleção!` : 'Nenhuma carta nova desta vez.'}</p>
        <div className="cardgrid">
          {pulls.map((p, i) => (
            <button key={i} className={`cell r-${TIER_CLASS[p.rarity]} pop`} style={{ animationDelay: `${Math.min(i, 24) * 60}ms` }} onClick={() => setZoom(p.id)}>
              <img src={art(p.id, 'small')} alt={cards[p.id]?.name ?? ''} draggable={false} />
              {p.isNew && <em className="nova">NOVA</em>}
            </button>
          ))}
        </div>
        <button className="hud-btn primary" style={{ flexShrink: 0 }} onClick={() => setResult(null)}><GameIcon name="check" /> Pronto</button>
        {zoom != null && <CardSheet code={zoom} cards={cards} onClose={() => setZoom(null)} />}
      </div>
    );
  }

  const entry = (e: ShopEntry) => {
    const one = price(e.pack), box = boxPrice(e.pack);
    return (
      <section key={e.pack.key} className={`pack shoppack hud${e.lock ? ' locked' : ''}`}>
        <PackCover k={e.pack.key} name={e.pack.shortName ?? e.pack.name} />
        <div className="shopinfo">
          <b>{e.pack.name}{e.isNew && <em className="nova">NOVA</em>}</b>
          <small className="stats">{e.pack.cards.length} cartas · 4 comuns + 1 Rara, Super ou Ultra</small>
          {e.lock ? (
            <p className="lock"><GameIcon name="lock" size={16} /> {lockHint(e.lock)} · <span className="num">{lockText(e.lock)}</span></p>
          ) : (
            <div className="acts">
              <button className="hud-btn primary" disabled={!canBuy(s, e.pack.key)} onClick={() => doBuy(e.pack.key)}>
                1 pacote · <Dp value={one ?? 0} />
              </button>
              <button className="hud-btn" disabled={!canBuy(s, e.pack.key, true)} onClick={() => doBox(e.pack.key)}>
                Caixa de 20 · <Dp value={box ?? 0} />
              </button>
              {!canBuy(s, e.pack.key) && missingDP(s, e.pack) > 0 && <small className="stats">Faltam <Dp value={missingDP(s, e.pack)} /></small>}
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="app deckb hexbg shop">
      <div className="hubtop">
        <button className="hud-btn" onClick={onBack} aria-label="Voltar"><GameIcon name="back" size={20} /></button>
        <b className="hubname">Loja do Vovô</b>
        <Dp value={s.dp} className="coins" />
      </div>
      <div className="shoplist">
        {s.unopenedPacks.length > 0 && (
          <section className="pack shoppack hud gifts">
            <PackCover k={s.unopenedPacks[0]} name={packByKey(s.unopenedPacks[0])?.name ?? ''} />
            <div className="shopinfo">
              <b>Pacotes ganhos</b>
              <small className="stats">{s.unopenedPacks.length} para abrir, sem custo</small>
              <button className="hud-btn gold" onClick={doOpenUnopened}><GameIcon name="gift" size={18} /> Abrir</button>
            </div>
          </section>
        )}
        <h4 className="shophead game-title">Coleções</h4>
        {collectionListing(s).map(entry)}
        <h4 className="shophead game-title">Pacotes de personagem</h4>
        {characterListing(s).map(entry)}
      </div>
    </div>
  );
}

function PackCover({ k, name }: { k: string; name: string }) {
  const [ok, setOk] = useState(true);
  return (
    <div className="packcover">
      {ok ? <img src={packImage(k)} alt="" draggable={false} onError={() => setOk(false)} /> : <span className="packart"><GameIcon name="pack" size={28} /><small>{name}</small></span>}
    </div>
  );
}
