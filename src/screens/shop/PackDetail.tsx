import { useState } from 'react';
import { sfx } from '../../audio/sfx';
import { BALANCE } from '../../campaign/balance';
import type { Rarity } from '../../campaign/data/types';
import {
  boxPrice, buy, buyBox, canBuy, characterListing, collectionListing, missingDP, packByKey, packCards, packStats, price,
  RARITY_NAME, type PackOpening,
} from '../../campaign/packs';
import { copies, type CampaignState } from '../../campaign/state';
import { CardFace } from '../../components/CardFace';
import { CardZoom } from '../../components/CardZoom';
import type { GameData } from '../../data/cards';
import type { Profile } from '../../story/profile';
import { Dp } from '../../ui/Dp';
import { GameIcon } from '../../ui/icons';
import { Modal } from '../../ui/Modal';
import { TopBar } from '../../ui/TopBar';
import { useWide } from '../../ui/wide';
import { CARD_SIZES, useCardSize } from '../../ui/cardSize';
import { CardSizeButton } from '../deck/TrunkBar';
import { useReducedMotion } from '../duel/anim/useReducedMotion';
import type { CharInfo } from '../campaign/chars';
import { OpeningFlow } from './OpeningFlow';
import { anyUltra } from './opening';
import { PackCover } from './PackCover';
import { ShopCounter } from './ShopCounter';
import { useSpeech } from './useSpeech';
import './shop.css';

const RARITIES: Rarity[] = ['ultra', 'super', 'rare', 'common'];
const SHORT_NAME: Record<Rarity, string> = { ultra: 'Ultra', super: 'Super', rare: 'Rara', common: 'Comum' };

/**
 * O detalhe de um pacote (`ShopPackDetailView` do nativo): o resumo com as raridades e quanto da coleção o jogador
 * tem, o balcão compacto, a grade das cartas (as que faltam apagadas) e a barra fixa de compra. A compra grava antes
 * da abertura, que é só encenação.
 */
export function PackDetail({ packKey, campaign: s, data, chars, profile, onChange, onBack }: {
  packKey: string; campaign: CampaignState; data: GameData; chars: Record<string, CharInfo>; profile: Profile;
  onChange: (s: CampaignState) => void; onBack: () => void;
}) {
  const reduced = useReducedMotion();
  const pack = packByKey(packKey);
  const entry = [...collectionListing(s), ...characterListing(s)].find((e) => e.pack.key === packKey);
  const one = pack ? price(pack) ?? 0 : 0, box = pack ? boxPrice(pack) ?? 0 : 0;
  const speech = useSpeech(s, profile, pack && !entry?.lock && !s.concluded && s.dp < one ? 'noFunds' : null);
  const [openings, setOpenings] = useState<PackOpening[] | null>(null);
  const [confirmBox, setConfirmBox] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  // Tela larga (change layout-desktop-telas): as cartas do pacote seguem o tamanho P/M/G, trocado no cabeçalho.
  const wide = useWide();
  const [size, setSize] = useCardSize();

  if (!pack) {
    return (
      <div className="app hexbg shopscreen">
        <TopBar title="Loja" onBack={onBack} />
        <p className="shopnote">Pacote fora da loja.</p>
      </div>
    );
  }

  const st = packStats(s, pack);
  const name = pack.name;
  const doBuy = () => {
    if (!canBuy(s, packKey)) { speech.say('noFunds'); return; }
    const r = buy(s, packKey); sfx.play('purchase'); onChange(r.state); setOpenings([r.opening]);
  };
  const askBox = () => (canBuy(s, packKey, true) ? setConfirmBox(true) : speech.say('noFunds'));
  const doBox = () => {
    setConfirmBox(false);
    const r = buyBox(s, packKey); sfx.play('purchase'); onChange(r.state); setOpenings(r.openings);
  };
  const closeOpening = () => {
    if (openings) speech.say(anyUltra(openings) ? 'pulledUltra' : openings.length > 1 ? 'boughtBox' : 'boughtPack');
    setOpenings(null);
  };
  const shortOne = missingDP(s, pack), shortBox = missingDP(s, pack, true);
  const saving = one * BALANCE.boxSize - box;

  return (
    <div className={`app hexbg shopscreen packdetail${reduced ? ' reduced' : ''}`} style={wide ? { ['--card-w' as string]: `${CARD_SIZES[size]}px` } : undefined}>
      <TopBar title={name} onBack={onBack} right={wide ? <CardSizeButton size={size} onSize={setSize} /> : undefined} />
      <div className="shopscroll">
        <section className="hud packsummary">
          <PackCover k={pack.key} name={pack.shortName ?? name} />
          <div className="summaryinfo">
            <b>{name}</b>
            <ul className="rarities">
              {RARITIES.filter((r) => st.byRarity[r] > 0).map((r) => (
                <li key={r} className={`rr-${r}`}><span className="num">{st.byRarity[r]}</span> {SHORT_NAME[r]}</li>
              ))}
            </ul>
            <span className="owned num">{st.owned} de {st.total} cartas</span>
            <span className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={st.total} aria-valuenow={st.owned}>
              <span style={{ width: `${st.total ? (st.owned / st.total) * 100 : 0}%` }} />
            </span>
          </div>
        </section>

        <ShopCounter size="compact" balance={s.dp} line={speech.line} onDismiss={speech.dismiss} chars={chars} reduced={reduced} />

        <h4 className="shophead game-title">Cartas do pacote</h4>
        <section className="hud packcards">
          {packCards(pack).map((c) => {
            const have = copies(s, c.id) > 0;
            return (
              <button key={c.id} className={`cell${have ? '' : ' missing'}`} onClick={() => setZoom(c.id)}
                aria-label={`${data.cards[String(c.id)]?.name ?? c.id}, ${RARITY_NAME[c.rarity]}${have ? '' : ', você não tem'}`}>
                <CardFace code={c.id} card={data.cards[String(c.id)]} />
              </button>
            );
          })}
        </section>
      </div>

      {!s.concluded && (
        <div className="buybar">
          {entry?.lock ? (
            <p className="locked"><GameIcon name="lock" size={16} /> Este pacote ainda não está à venda.</p>
          ) : (
            <>
              <p className="saldo">
                <span>Saldo: <Dp value={s.dp} /></span>
                {s.dp >= one && <span className="after">Saldo depois: <Dp value={s.dp - one} /></span>}
              </p>
              <div className="acts">
                <button className={`hud-btn primary${shortOne ? ' short' : ''}`} aria-disabled={shortOne > 0} onClick={doBuy}>
                  <b>Comprar 1 pacote</b>
                  <small>{shortOne ? `faltam ${shortOne} DP` : `${one} DP`}</small>
                </button>
                <button className={`hud-btn secondary boxbtn${shortBox ? ' short' : ''}`} aria-disabled={shortBox > 0} onClick={askBox}>
                  <PackCover k={pack.key} name={pack.shortName ?? name} className="mini" />
                  <span><b>Caixa · {BALANCE.boxSize} pacotes</b><small>{shortBox ? `faltam ${shortBox} DP` : `${box} DP`}</small></span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {confirmBox && (
        <Modal title="Comprar a caixa?" onClose={() => setConfirmBox(false)}>
          <p>{BALANCE.boxSize} pacotes de {name} por <Dp value={box} />.</p>
          <p>Você economiza <Dp value={saving} /> em relação a {BALANCE.boxSize} pacotes avulsos.</p>
          <p>Saldo depois: <Dp value={s.dp - box} /></p>
          <div className="acts">
            <button className="hud-btn secondary" onClick={() => setConfirmBox(false)}>Cancelar</button>
            <button className="hud-btn primary" onClick={doBox}><GameIcon name="box" size={18} /> Comprar a caixa</button>
          </div>
        </Modal>
      )}

      {openings && <OpeningFlow openings={openings} packName={name} cards={data.cards} reduced={reduced} onDone={closeOpening} />}
      {zoom != null && <CardZoom code={zoom} cards={data.cards} onClose={() => setZoom(null)} />}
    </div>
  );
}
