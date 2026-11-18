import { useEffect, useRef, useState } from 'react';
import { BALANCE } from '../../campaign/balance';
import { needsAttention } from '../../campaign/bond';
import { awaitsNextUpdate, dayProgress } from '../../campaign/calendar';
import { placements, tierProgress } from '../../campaign/map';
import { PERIOD_KEYS, PERIOD_NAMES, type CampaignState } from '../../campaign/state';
import { Dp } from '../../ui/Dp';
import { BondHearts } from '../../ui/BondHearts';
import { GameIcon } from '../../ui/icons';
import { Modal } from '../../ui/Modal';
import { faceOf, mapImage, mapSettled, preloadMap } from './assets';
import './campaign.css';

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
 * Mapa da Cidade de Domino, como o do Tag Force Special: o panorama (que rola na horizontal) no tom do período e as
 * cabeças de quem está por perto, cada uma num ponto sorteado, sem lugares nem nomes (o "!" de evento, a coroa do
 * chefe). Tocar numa cabeça vai direto ao encontro. Embaixo, os atalhos (Deck, Coleção, Laços, Loja); o menu do
 * cabeçalho abre as Opções (Status da campanha, Voltar ao título).
 */
export function MapScreen({ s, onMeet, onShop, onDecks, onCollection, onBonds, onStatus, onTitle }: {
  s: CampaignState;
  onMeet: (duelist: string) => void; onShop: () => void; onDecks: () => void; onCollection: () => void; onBonds: () => void;
  onStatus: () => void; onTitle: () => void;
}) {
  const [options, setOptions] = useState(false);
  const period = PERIOD_KEYS[s.period];
  const people = placements(s);
  const [imgOk, setImgOk] = useState(mapSettled(period) !== false);
  // Já pronto ao montar (o caso comum): aparece direto; senão, entra com um fade quando terminar de carregar.
  const [instant] = useState(mapSettled(period) !== undefined);
  // O mapa e as cabeças só aparecem com o panorama já decodificado (normalmente na hora: o App pré-carrega ao abrir).
  const [shown, setShown] = useState<string | null>(instant ? period : null);
  useEffect(() => {
    let live = true;
    preloadMap(period).then((ok) => { if (!live) return; if (!ok) setImgOk(false); setShown(period); });
    return () => { live = false; };
  }, [period]);
  const scroller = useRef<HTMLDivElement>(null);
  // Começa com o centro do panorama à vista (é onde ficam os pontos).
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [imgOk]);

  return (
    <div className={`app campmap p-${period}`}>
      <CampaignHeader s={s} onMenu={() => setOptions(true)} />
      <div className="mapscroll" ref={scroller}>
        <div className={`mapcanvas${imgOk ? '' : ' noimg'}${shown === period ? '' : ' loading'}${instant ? ' instant' : ''}`}>
          {imgOk && <img className="mapimg" src={mapImage(period)} alt="" draggable={false} onError={() => setImgOk(false)} />}
          <div className="period-tint" />
          {people.map(({ duelist: d, point }, i) => (
            <button key={d.key} className={`pinhead${d.isBoss ? ' boss' : ''}`}
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%`, animationDelay: `${-i * 0.6}s` }}
              onClick={() => onMeet(d.key)} aria-label={`Encontrar ${d.name}`}>
              <img src={faceOf(d.key)} alt="" draggable={false} />
              {d.isBoss && <GameIcon name="boss" size={16} />}
              {needsAttention(s, d.key) && <b>!</b>}
            </button>
          ))}
        </div>
      </div>
      <nav className="mapnav">
        <button className="hud-btn" onClick={onDecks}><GameIcon name="deck" size={20} /> Deck</button>
        <button className="hud-btn" onClick={onCollection}><GameIcon name="collection" size={20} /> Coleção</button>
        <button className="hud-btn" onClick={onBonds}><GameIcon name="heart" size={20} /> Laços</button>
        <button className="hud-btn" onClick={onShop}><GameIcon name="shop" size={20} /> Loja</button>
      </nav>
      {options && (
        <Modal title="Opções" onClose={() => setOptions(false)} className="mapoptions">
          <button className="hud-btn" onClick={() => { setOptions(false); onStatus(); }}><GameIcon name="status" size={20} /> Status da campanha</button>
          <button className="hud-btn" onClick={() => { setOptions(false); onTitle(); }}><GameIcon name="back" size={20} /> Voltar ao título</button>
          <button className="hud-btn danger" onClick={() => setOptions(false)}>Fechar</button>
        </Modal>
      )}
    </div>
  );
}
