import { useEffect, useRef, useState } from 'react';
import { BALANCE } from '../../campaign/balance';
import { hearts, needsAttention } from '../../campaign/bond';
import { awaitsNextUpdate, dayProgress } from '../../campaign/calendar';
import type { DuelistData, LocationData } from '../../campaign/data/types';
import { BOSS, LOCATIONS, present, tierProgress } from '../../campaign/map';
import { PERIOD_KEYS, PERIOD_NAMES, type CampaignState } from '../../campaign/state';
import { Backdrop } from '../../components/CardSheet';
import { Dp } from '../../ui/Dp';
import { BondHearts } from '../../ui/BondHearts';
import { GameIcon, type GameIconName } from '../../ui/icons';
import { faceOf, mapImage } from './assets';
import './campaign.css';

const ICON: Record<string, GameIconName> = { school: 'school', burger: 'burger', arcade: 'arcade', park: 'park', gameShop: 'shop' };

/** Corações de um duelista (0 a 4, o atual pela fração), no desenho do nativo. */
export const Hearts = ({ value, size = 14 }: { value: number; size?: number }) => <BondHearts value={value} size={size} />;

/** Cabeçalho da campanha: dia, período, DP, barra dos dias e o progresso do tier. */
export function CampaignHeader({ s, onMenu }: { s: CampaignState; onMenu?: () => void }) {
  const tp = tierProgress(s);
  return (
    <div className="camphead hud">
      {onMenu && <button className="hud-btn iconbtn" onClick={onMenu} aria-label="Menu"><GameIcon name="menu" size={22} /></button>}
      <div className="camphead-main">
        <div className="camphead-row">
          <b className="game-title">Dia {s.day}</b>
          <span className={`periodchip p-${PERIOD_KEYS[s.period]}`}>{PERIOD_NAMES[s.period]}</span>
          <Dp value={s.dp} className="camphead-dp" />
        </div>
        <div className="daybar" role="progressbar" aria-label="Dias da campanha" aria-valuenow={s.day} aria-valuemin={1} aria-valuemax={BALANCE.days}>
          <i style={{ width: `${dayProgress(s) * 100}%` }} />
        </div>
        <small className="tierline">
          Tier {tp.number}: {tp.name} · <span className="num">{tp.beaten}/{tp.total}</span> vencidos · {tp.boss}
          {awaitsNextUpdate(s) && ' · o próximo tier chega numa atualização'}
        </small>
      </div>
    </div>
  );
}

/**
 * Mapa da Cidade de Domino: o panorama (que rola na horizontal) no tom do período, os lugares com quem está lá, o "!"
 * de evento e o chefe com coroa; tocar num lugar abre o painel. Embaixo, os atalhos.
 */
export function MapScreen({ s, onMeet, onShop, onDecks, onBonds, onStatus, onMenu }: {
  s: CampaignState;
  onMeet: (duelist: string) => void; onShop: () => void; onDecks: () => void; onBonds: () => void; onStatus: () => void; onMenu: () => void;
}) {
  const period = PERIOD_KEYS[s.period];
  const here = present(s);
  const [panel, setPanel] = useState<LocationData | null>(null);
  const [imgOk, setImgOk] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  // Começa com o centro do panorama à vista.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [imgOk]);

  const at = (loc: LocationData) => here.filter((d) => d.location === loc.key);
  return (
    <div className={`app campmap p-${period}`}>
      <CampaignHeader s={s} onMenu={onMenu} />
      <div className="mapscroll" ref={scroller}>
        <div className={`mapcanvas${imgOk ? '' : ' noimg'}`}>
          {imgOk && <img className="mapimg" src={mapImage(period)} alt="" draggable={false} onError={() => setImgOk(false)} />}
          <div className="period-tint" />
          {LOCATIONS.map((loc) => {
            const people = at(loc);
            const boss = people.find((d) => d.isBoss);
            const alert = people.some((d) => needsAttention(s, d.key));
            return (
              <button key={loc.key} className={`mappin${loc.isShop ? ' shop' : ''}${people.length ? '' : ' empty'}`}
                style={{ left: `${loc.x * 100}%`, top: `${loc.y * 100}%` }} onClick={() => setPanel(loc)}
                aria-label={`${loc.name}: ${people.length ? people.map((d) => d.name).join(', ') : 'ninguém'}`}>
                {boss && <span className="pinboss"><img src={faceOf(boss.key)} alt="" /><GameIcon name="boss" size={16} /></span>}
                {!boss && alert && <span className="pinface"><img src={faceOf(people.find((d) => needsAttention(s, d.key))!.key)} alt="" /><b>!</b></span>}
                <span className="pinlabel hud"><GameIcon name={ICON[loc.icon] ?? 'mapPin'} size={16} /> {loc.name}
                  {!loc.isShop && <span className="pincount num">{people.filter((d) => !d.isBoss).length}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <nav className="mapnav">
        <button className="hud-btn" onClick={onDecks}><GameIcon name="deck" size={20} /> Deck</button>
        <button className="hud-btn" onClick={onBonds}><GameIcon name="heart" size={20} /> Laços</button>
        <button className="hud-btn" onClick={onShop}><GameIcon name="shop" size={20} /> Loja</button>
        <button className="hud-btn" onClick={onStatus}><GameIcon name="status" size={20} /> Status</button>
      </nav>
      {panel && <PlacePanel s={s} loc={panel} people={at(panel)} onClose={() => setPanel(null)}
        onMeet={(k) => { setPanel(null); onMeet(k); }} onShop={() => { setPanel(null); onShop(); }} />}
    </div>
  );
}

function PlacePanel({ s, loc, people, onClose, onMeet, onShop }: {
  s: CampaignState; loc: LocationData; people: DuelistData[]; onClose: () => void; onMeet: (k: string) => void; onShop: () => void;
}) {
  return (
    <div className="scrim">
      <Backdrop onClose={onClose} />
      <div className="sheet hud placepanel" role="dialog" aria-label={loc.name}>
        <h4>{loc.name}</h4>
        {loc.isShop && <button className="hud-btn primary" onClick={onShop}><GameIcon name="shop" size={20} /> Entrar na loja</button>}
        {people.length === 0 && !loc.isShop && <p className="stats">Não tem ninguém aqui agora.</p>}
        {loc.isShop && !people.length && BOSS && <p className="stats">{s.defeatedBosses.length ? '' : `${BOSS.name} ainda não está esperando por você.`}</p>}
        {people.map((d) => (
          <button key={d.key} className={`hud-btn person${d.isBoss ? ' gold' : ''}`} onClick={() => onMeet(d.key)}>
            <img src={faceOf(d.key)} alt="" />
            <span><b>{d.name}</b><Hearts value={hearts(s, d.key)} /></span>
            {needsAttention(s, d.key) && <b className="alert">!</b>}
            <span className="go">Encontrar <GameIcon name="chevron" size={16} /></span>
          </button>
        ))}
        <button className="hud-btn" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
