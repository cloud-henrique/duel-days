import { useState } from 'react';
import type { Settings } from '../../story/progress';
import { SettingsChoices } from '../../ui/Choice';
import { TopBar } from '../../ui/TopBar';
import { Backdrop } from '../../components/CardSheet';
import { GameIcon } from '../../ui/icons';

/** Ajustes do app inteiro: animações e som (os mesmos do menu do duelo) e apagar o save, com confirmação. */
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
          <p className="stats" style={{ margin: 0 }}>Apaga o perfil, a coleção, os decks e o progresso da história.</p>
          <button className="hud-btn danger" onClick={() => setConfirm(true)}><GameIcon name="delete" /> Apagar save</button>
        </section>
      </div>
      {confirm && (
        <div className="scrim center">
          <Backdrop onClose={() => setConfirm(false)} />
          <div className="sheet hud">
            <h4>Apagar o save?</h4>
            <p className="stats" style={{ margin: 0 }}>Não dá para desfazer.</p>
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
