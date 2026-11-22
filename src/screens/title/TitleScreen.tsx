import { useState } from 'react';
import type { Progress } from '../../story/progress';
import { profileOf } from '../../story/profile';
import { PERIOD_NAMES } from '../../campaign/state';
import { GameIcon } from '../../ui/icons';
import { Dp } from '../../ui/Dp';
import { Wordmark } from '../../ui/titles';
import { PolyCard } from '../../ui/PolyCard';
import { avatarFace } from '../profile/ProfileFields';
import { SyncBadge } from '../sync/SyncBadge';
import './title.css';

const BASE = import.meta.env.BASE_URL;

/** O botão principal: sem campanha, "Campanha"; em andamento, "Continuar" com o dia e o período; terminada, o fim. */
export function campaignEntry(p: Progress): { label: string; sub: string; dp: number | null } {
  const c = p.campaign;
  if (!c) return { label: 'Campanha', sub: 'Comece o dia 1 em Domino', dp: null };
  if (c.concluded) return { label: 'Campanha', sub: 'Os 30 dias acabaram', dp: c.dp };
  return { label: 'Continuar', sub: `Dia ${c.day} · ${PERIOD_NAMES[c.period]}`, dp: c.dp };
}

/** O orbe azul com o leque de cartas (a espiral da Polimerização em silhueta) atrás do logo, como na tela de título do *Duel Links*. */
function TitleOrb() {
  return (
    <div className="titleorb" aria-hidden="true">
      <div className="orb-halo" /><div className="orb-ball" /><div className="orb-ring r1" /><div className="orb-ring r2" />
      {[0, 1, 2, 3, 4].map((i) => <i key={i} className={`orb-spark s${i}`} />)}
      <div className="fan">
        {[-1, 0, 1].map((d) => <div key={d} className="fancard" style={{ ['--d' as string]: d }}><PolyCard /></div>)}
      </div>
    </div>
  );
}

/**
 * Tela de título: o orbe com o leque, o logo "Yu-Gi-Oh!" (arte fora do git; some se não carregar), "DUEL DAYS" metálico,
 * o perfil, o indicador da nuvem e os ajustes no topo, "Campanha"/"Continuar" e "Meu deck". Só entradas para o que já
 * existe. `syncing`: a abertura ainda espera a nuvem (até ~3 s), e a campanha fica travada para não jogar sobre um save velho.
 */
export function TitleScreen({ progress, onPlay, onDecks, onProfile, onSettings, syncing = false }: {
  progress: Progress; onPlay: () => void; onDecks: () => void; onProfile: () => void; onSettings: () => void; syncing?: boolean;
}) {
  const [logoOk, setLogoOk] = useState(true);
  const profile = profileOf(progress);
  const entry = campaignEntry(progress);
  return (
    <div className="app titlescreen hexbg">
      <div className="titletop">
        <button className="profilechip hud" onClick={onProfile} aria-label={`Perfil: ${profile.name}`}>
          <img src={avatarFace(profile.avatar)} alt="" draggable={false} />
          <span><b>{profile.name}</b><small>Perfil</small></span>
        </button>
        <SyncBadge />
        <button className="hud-btn iconbtn big" onClick={onSettings} aria-label="Ajustes"><GameIcon name="settings" size={28} big /></button>
      </div>
      <div className="titlehero">
        <TitleOrb />
        {logoOk && <img className="titlelogo" src={`${BASE}brand/logo-yugioh.png`} alt="Yu-Gi-Oh!" draggable={false} onError={() => setLogoOk(false)} />}
        <Wordmark shine />
      </div>
      <div className="titlebtns">
        <button className="hud-btn primary titleplay" onClick={onPlay} disabled={syncing}>
          <GameIcon name="campaign" size={32} big />
          <span className="titleplay-text">
            <b className="game-title">{entry.label}</b>
            <small>{syncing ? 'Sincronizando…' : entry.sub}</small>
            {entry.dp !== null && <Dp value={entry.dp} className="titleplay-dp" />}
          </span>
          <GameIcon name="chevron" size={20} />
        </button>
        <button className="hud-btn titledeck" onClick={onDecks}><GameIcon name="deck" size={20} /> Meu deck</button>
      </div>
      <p className="titlefoot stats">Projeto pessoal, sem fins comerciais</p>
    </div>
  );
}
