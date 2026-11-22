import { useState } from 'react';
import type { Settings } from '../../story/progress';
import { SettingsChoices } from '../../ui/Choice';
import { TopBar } from '../../ui/TopBar';
import { Backdrop } from '../../components/CardSheet';
import { GameIcon } from '../../ui/icons';

/**
 * Ajustes do app inteiro: animações, efeitos e música (os mesmos do menu do duelo) e apagar o save, com confirmação. Os
 * ajustes e o apagar seguem a conta (change save-na-nuvem): valem em todos os aparelhos.
 */
export function SettingsScreen({ settings, onSettings, onErase, onBack }: { settings: Settings; onSettings: (s: Settings) => void; onErase: () => void; onBack: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="app screen hexbg">
      <TopBar title="Ajustes" onBack={onBack} />
      <div className="screen-scroll">
        <section className="hud panelbox">
          <SettingsChoices settings={settings} onSettings={onSettings} />
        </section>
        <section className="hud panelbox">
          <span className="field-label game-title">Save</span>
          <p className="stats" style={{ margin: 0 }}>Apaga o perfil e a campanha (coleção, decks, DP e laços) neste e em todos os aparelhos da sua conta.</p>
          <button className="hud-btn danger" onClick={() => setConfirm(true)}><GameIcon name="delete" /> Apagar save</button>
        </section>
      </div>
      {confirm && (
        <div className="scrim center">
          <Backdrop onClose={() => setConfirm(false)} />
          <div className="sheet hud">
            <h4>Apagar o save?</h4>
            <p className="stats" style={{ margin: 0 }}>Vale para todos os aparelhos em que você joga com esta conta. Não dá para desfazer.</p>
            <div className="acts">
              <button className="hud-btn danger" onClick={onErase}>Apagar</button>
              <button className="hud-btn" onClick={() => setConfirm(false)}>Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
