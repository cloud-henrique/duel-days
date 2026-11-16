import { useState } from 'react';
import { Backdrop } from '../../components/CardSheet';
import type { Settings } from '../../story/progress';
import { SettingsChoices } from '../../ui/Choice';
import { GameIcon } from '../../ui/icons';

/**
 * Botão de menu do duelo (hambúrguer): abre as opções (animações, som) e "Desistir", que pede confirmação. As
 * preferências são salvas por quem chama (`onSettings`).
 */
export function DuelMenu({ onSurrender, settings, onSettings }: { onSurrender: () => void; settings: Settings; onSettings: (s: Settings) => void }) {
  const [step, setStep] = useState<'closed' | 'menu' | 'confirm'>('closed');
  const close = () => setStep('closed');
  return (
    <>
      <button className="menubtn hud-btn" aria-label="Menu" onClick={() => setStep('menu')}><GameIcon name="menu" size={24} /></button>
      {step !== 'closed' && (
        <div className="scrim center">
          <Backdrop onClose={close} />
          <div className="sheet hud">
            {step === 'menu'
              ? <>
                <h4>Menu</h4>
                <SettingsChoices settings={settings} onSettings={onSettings} />
                <button className="hud-btn" onClick={() => setStep('confirm')}>Desistir</button>
                <button className="hud-btn" onClick={close}>Voltar ao duelo</button>
              </>
              : <>
                <h4>Desistir do duelo?</h4>
                <p className="stats" style={{ margin: 0 }}>Conta como derrota.</p>
                <div className="acts">
                  <button className="hud-btn primary" onClick={() => { close(); onSurrender(); }}>Confirmar</button>
                  <button className="hud-btn" onClick={close}>Continuar</button>
                </div>
              </>}
          </div>
        </div>
      )}
    </>
  );
}
