import { useState } from 'react';
import { epilogueDuelist } from '../../campaign/bond';
import { daysLeft } from '../../campaign/calendar';
import { PERIOD_NAMES, type CampaignState } from '../../campaign/state';
import { Dp } from '../../ui/Dp';
import { GameIcon } from '../../ui/icons';

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <li><span>{label}</span><b className="num">{children}</b></li>
);

/** Status da campanha: dia, dias restantes, vitórias, derrotas e DP; e a opção de recomeçar. */
export function StatusScreen({ s, onRestart, onBack }: { s: CampaignState; onRestart: () => void; onBack: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="app deckb hexbg status">
      <div className="hubtop">
        <button className="hud-btn" onClick={onBack} aria-label="Voltar"><GameIcon name="back" size={20} /></button>
        <b className="hubname">Status</b>
      </div>
      <ul className="statlist hud">
        <Row label="Dia">{s.day} · {PERIOD_NAMES[s.period]}</Row>
        <Row label="Dias restantes">{s.concluded ? 0 : daysLeft(s)}</Row>
        <Row label="Vitórias">{s.wins}</Row>
        <Row label="Derrotas">{s.losses}</Row>
        <Row label="DP"><Dp value={s.dp} /></Row>
        <Row label="Cartas diferentes">{Object.keys(s.collection).length}</Row>
      </ul>
      {!confirm
        ? <button className="hud-btn" onClick={() => setConfirm(true)}><GameIcon name="newGame" size={18} /> Nova campanha</button>
        : (
          <div className="confirm hud">
            <p>Recomeçar do dia 1? A coleção, os decks, o DP e os laços desta campanha {epilogueDuelist(s) ? 'e o epílogo ' : ''}serão perdidos.</p>
            <div className="acts">
              <button className="hud-btn" onClick={() => setConfirm(false)}>Cancelar</button>
              <button className="hud-btn primary" onClick={onRestart}>Recomeçar</button>
            </div>
          </div>
        )}
    </div>
  );
}
