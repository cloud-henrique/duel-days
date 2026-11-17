import { useState } from 'react';
import { epilogueDuelist } from '../../campaign/bond';
import { daysLeft } from '../../campaign/calendar';
import { PERIOD_NAMES, type CampaignState } from '../../campaign/state';
import { bossBeaten, bossOf, currentTier, hasContent, nextTier, openTiers } from '../../campaign/tiers';
import { Dp } from '../../ui/Dp';
import { TopBar } from '../../ui/TopBar';
import { GameIcon } from '../../ui/icons';

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <li><span>{label}</span><b className="num">{children}</b></li>
);

/** O próximo tier: o dia em que abre pelo prazo, ou o aviso de que chega numa atualização. */
function nextTierText(s: CampaignState): string | null {
  const next = nextTier(s);
  if (!next) return null;
  return hasContent(next) ? `Tier ${next.number} · dia ${next.firstDay}` : `Tier ${next.number} · numa atualização`;
}

/**
 * Status da campanha: dia, dias restantes, o tier atual, os abertos, os chefes vencidos e quando o próximo tier abre;
 * vitórias, derrotas e DP; e a opção de recomeçar.
 */
export function StatusScreen({ s, onRestart, onBack }: { s: CampaignState; onRestart: () => void; onBack: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const cur = currentTier(s);
  const bosses = openTiers(s).filter((t) => bossBeaten(s, t)).map((t) => bossOf(t)?.name).filter(Boolean);
  const next = nextTierText(s);
  return (
    <div className="app deckb hexbg status">
      <TopBar title="Status" onBack={onBack} subtitle={`Tier ${cur.number}: ${cur.name} · dia ${s.day}`} />
      <ul className="statlist hud">
        <Row label="Dia">{s.day} · {PERIOD_NAMES[s.period]}</Row>
        <Row label="Dias restantes">{s.concluded ? 0 : daysLeft(s)}</Row>
        <Row label="Tier atual">{cur.number}: {cur.name}</Row>
        <Row label="Tiers abertos">{openTiers(s).map((t) => t.number).join(', ')}</Row>
        <Row label="Chefes vencidos">{bosses.length ? bosses.join(', ') : 'nenhum'}</Row>
        {next && <Row label="Próximo tier">{next}</Row>}
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
