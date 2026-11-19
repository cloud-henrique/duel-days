import { useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Backdrop } from '../../components/CardSheet';
import type { Settings } from '../../story/progress';
import { SettingsChoices } from '../../ui/Choice';
import { GameIcon } from '../../ui/icons';

/**
 * Botão de menu do duelo (hambúrguer): abre as opções (animações, correntes, som, música) e "Desistir", que pede
 * confirmação. As preferências são salvas por quem chama (`onSettings`).
 *
 * O véu vai num portal em `host` (o `.duel`): dentro da `.foebar`, o `filter` do brilho da placa vira a referência do
 * `position: absolute` e o painel ficava espremido na barra de cima, só com o título.
 */
export function DuelMenu({ onSurrender, settings, onSettings, host }: {
  onSurrender: () => void; settings: Settings; onSettings: (s: Settings) => void; host?: RefObject<HTMLElement | null>;
}) {
  const [step, setStep] = useState<'closed' | 'menu' | 'confirm'>('closed');
  const close = () => setStep('closed');
  return (
    <>
      <button className="menubtn hud-btn" aria-label="Menu" onClick={() => setStep('menu')}><GameIcon name="menu" size={24} /></button>
      {step !== 'closed' && createPortal(
        <div className="scrim center duelmenu">
          <Backdrop onClose={close} />
          <div className="sheet hud">
            {step === 'menu'
              ? <>
                <h4>Opções</h4>
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
        </div>,
        host?.current ?? document.body,
      )}
    </>
  );
}
