import { useState } from 'react';
import { BALANCE } from '../../campaign/balance';
import { epilogue } from '../../campaign/bond';
import type { CampaignState } from '../../campaign/state';
import { Dp } from '../../ui/Dp';
import { GameIcon } from '../../ui/icons';
import { DisplayTitle } from '../../ui/titles';

/** Tela de fim: o resumo dos 30 dias, Rever epílogo, Ver a coleção e Nova campanha (com confirmação). */
export function CampaignEnd({ s, onEpilogue, onChampion, onCollection, onRestart, onTitle }: {
  s: CampaignState; onEpilogue: () => void; onChampion?: () => void; onCollection: () => void; onRestart: () => void; onTitle: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const ep = epilogue(s);
  return (
    <div className="app deckb hexbg campend">
      <DisplayTitle tone="draw">FIM DA CAMPANHA</DisplayTitle>
      <p className="stats">Os {BALANCE.days} dias acabaram.</p>
      <ul className="statlist hud">
        <li><span>Vitórias</span><b className="num">{s.wins}</b></li>
        <li><span>Derrotas</span><b className="num">{s.losses}</b></li>
        <li><span>DP ganho</span><b className="num"><Dp value={s.totalDPEarned} /></b></li>
        <li><span>Cartas diferentes</span><b className="num">{Object.keys(s.collection).length}</b></li>
        <li><span>Chefes vencidos</span><b className="num">{s.defeatedBosses.length}</b></li>
        {s.champion && <li><span>Campeão da Batalha da Cidade</span><b className="num">dia {s.champion.day}</b></li>}
      </ul>
      {s.champion && onChampion && <button className="hud-btn gold" onClick={onChampion}><GameIcon name="trophy" size={18} /> Rever cena de campeão</button>}
      {ep && <button className="hud-btn gold" onClick={onEpilogue}><GameIcon name="heart" size={18} /> Rever epílogo ({ep.duelist.name})</button>}
      <button className="hud-btn primary" onClick={onCollection}><GameIcon name="collection" size={18} /> Ver a coleção</button>
      {!confirm
        ? <button className="hud-btn" onClick={() => setConfirm(true)}><GameIcon name="newGame" size={18} /> Nova campanha</button>
        : (
          <div className="confirm hud">
            <p>Começar uma campanha nova do dia 1? Esta fica para trás.</p>
            <div className="acts">
              <button className="hud-btn" onClick={() => setConfirm(false)}>Cancelar</button>
              <button className="hud-btn primary" onClick={onRestart}>Começar</button>
            </div>
          </div>
        )}
      <button className="hud-btn" onClick={onTitle}>Voltar ao título</button>
    </div>
  );
}
