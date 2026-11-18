import { useEffect, useState, type CSSProperties } from 'react';
import { characterListing, collectionListing, missingDP, openUnopened, packByKey, price, type PackOpening, type ShopEntry, type Lock } from '../../campaign/packs';
import type { CampaignState } from '../../campaign/state';
import type { GameData } from '../../data/cards';
import type { Profile } from '../../story/profile';
import { Dp } from '../../ui/Dp';
import { GameIcon } from '../../ui/icons';
import { TopBar } from '../../ui/TopBar';
import { useReducedMotion } from '../duel/anim/useReducedMotion';
import type { CharInfo } from '../campaign/chars';
import { OpeningFlow } from './OpeningFlow';
import { anyUltra } from './opening';
import { PackCover } from './PackCover';
import { PackRules } from './PackRules';
import { SHOP_PACING } from './pacing';
import { ShopCounter } from './ShopCounter';
import { useSpeech } from './useSpeech';
import './shop.css';

const lockText = (l: Lock) =>
  l.kind === 'day' ? `Dia ${l.day}` : l.kind === 'tier' ? `Tier ${l.tier} · dia ${l.day}` : `${l.wins}/${l.goal}`;
const lockHint = (l: Lock) =>
  l.kind === 'day' ? `Chega à loja no dia ${l.day}`
  : l.kind === 'tier' ? `Chega com o Tier ${l.tier} (no dia ${l.day}, ou antes se vencer o chefe)`
  : `Vença ${l.name} ${l.goal} vezes`;

/**
 * A loja da campanha (a `CampaignShopView` do nativo): o balcão do vovô, os pacotes ganhos, a vitrine das coleções e a
 * dos pacotes de personagem. Tocar numa capa abre o detalhe do pacote (onde se compra); os ganhos abrem aqui mesmo.
 * Não gasta período.
 */
export function ShopScreen({ campaign: s, data, chars, profile, onChange, onBack, onPack }: {
  campaign: CampaignState; data: GameData; chars: Record<string, CharInfo>; profile: Profile;
  onChange: (s: CampaignState) => void; onBack: () => void; onPack: (key: string) => void;
}) {
  const reduced = useReducedMotion();
  const speech = useSpeech(s, profile, 'welcome');
  const [opening, setOpening] = useState<PackOpening | null>(null);
  const [help, setHelp] = useState(false);
  const [hint, setHint] = useState<{ key: string; text: string; n: number } | null>(null);

  const openGift = () => { const r = openUnopened(s); onChange(r.state); setOpening(r.opening); };
  const closeOpening = () => { if (opening && anyUltra([opening])) speech.say('pulledUltra'); setOpening(null); };
  // O aviso do bloqueado some sozinho, como o balão do vovô.
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), SHOP_PACING.speechMs);
    return () => clearTimeout(t);
  }, [hint?.n]);
  const tapLocked = (e: ShopEntry) => setHint({ key: e.pack.key, text: lockHint(e.lock!), n: (hint?.n ?? 0) + 1 });

  let order = 0;
  const cell = (e: ShopEntry) => {
    const one = price(e.pack) ?? 0;
    const short = missingDP(s, e.pack);
    const style = { '--d': `${order++ * SHOP_PACING.cascadeStepMs}ms` } as CSSProperties;
    const shaking = hint?.key === e.pack.key;
    return (
      <button key={e.pack.key} type="button" style={style}
        className={`shopcell${e.lock ? ' locked' : ''}${shaking ? ' shake' : ''}`}
        onAnimationEnd={(ev) => { if (ev.animationName === 'shop-shake') ev.currentTarget.classList.remove('shake'); }}
        data-sound={e.lock ? 'none' : undefined}
        onClick={() => (e.lock ? tapLocked(e) : onPack(e.pack.key))}
        aria-label={`${e.pack.name}${e.lock ? `, bloqueado: ${lockHint(e.lock)}` : ''}`}>
        <span className="coverwrap">
          <PackCover k={e.pack.key} name={e.pack.shortName ?? e.pack.name} />
          {e.lock && <span className="lockveil"><GameIcon name={e.lock.kind === 'wins' ? 'lock' : 'calendar'} size={26} /></span>}
          {e.isNew && <em className="nova">NOVA</em>}
        </span>
        <span className="cellname">{e.pack.shortName ?? e.pack.name}</span>
        {e.lock ? <span className="celllock num">{lockText(e.lock)}</span> : (
          <span className={`cellprice${short ? ' short' : ''}`}>
            <Dp value={one} />
            {short > 0 && <small>faltam {short} DP</small>}
          </span>
        )}
      </button>
    );
  };

  const characters = characterListing(s);
  return (
    <div className={`app hexbg shopscreen${reduced ? ' reduced' : ''}`}>
      <TopBar title="Loja" onBack={onBack}
        right={<button className="hud-btn iconbtn" onClick={() => setHelp(true)} aria-label="Como funcionam os pacotes?"><GameIcon name="question" size={22} /></button>} />
      <div className="shopscroll">
        <ShopCounter size="tall" balance={s.dp} line={speech.line} onDismiss={speech.dismiss} chars={chars} reduced={reduced} />

        {s.unopenedPacks.length > 0 && (
          <>
            <h4 className="shophead game-title">Pacotes ganhos</h4>
            <section className="hud gifts">
              <PackCover k={s.unopenedPacks[0]} name={packByKey(s.unopenedPacks[0])?.name ?? ''} />
              <div className="giftinfo">
                <p>{s.unopenedPacks.length === 1 ? '1 pacote esperando por você.' : `${s.unopenedPacks.length} pacotes esperando por você.`}</p>
                <button className="hud-btn primary" onClick={openGift} disabled={s.concluded}>
                  <GameIcon name="gift" size={18} /> Abrir pacote grátis <span className="badge num">{s.unopenedPacks.length}</span>
                </button>
              </div>
            </section>
          </>
        )}

        <h4 className="shophead game-title">À venda</h4>
        <section className="hud shopgrid">{collectionListing(s).map(cell)}</section>

        {characters.length > 0 && (
          <>
            <h4 className="shophead game-title">Pacotes de personagem</h4>
            <section className="hud shopgrid">{characters.map(cell)}</section>
            <p className="shopnote">Cada duelista libera o próprio pacote depois de 5 vitórias contra ele.</p>
          </>
        )}
        {hint && <p className="shophint" key={hint.n} role="status"><GameIcon name="lock" size={14} /> {hint.text}</p>}
      </div>

      {opening && (
        <OpeningFlow openings={[opening]} packName={packByKey(opening.packKey)?.name ?? 'Pacote'} cards={data.cards}
          reduced={reduced} onDone={closeOpening} />
      )}
      {help && <PackRules onClose={() => setHelp(false)} />}
    </div>
  );
}
