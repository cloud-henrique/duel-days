import { useState } from 'react';
import { List } from '@phosphor-icons/react';
import { Backdrop } from '../../components/CardSheet';
import type { Settings } from '../../story/progress';

const burger = <List size={24} weight="bold" aria-hidden="true" />;

const ANIM: [Settings['anim'], string][] = [['normal', 'Normal'], ['fast', 'Rápida'], ['off', 'Desligada']];
const SOUND: [boolean, string][] = [[true, 'Ligado'], [false, 'Desligado']];

/** Uma linha de opções exclusivas (a escolhida fica marcada). */
function Choice<T>({ label, options, value, onPick }: { label: string; options: [T, string][]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="menu-opt" role="group" aria-label={label}>
      <span>{label}</span>
      <div className="acts">
        {options.map(([v, text]) => (
          <button key={text} className={`hud-btn${v === value ? ' primary' : ''}`} aria-pressed={v === value} onClick={() => onPick(v)}>{text}</button>
        ))}
      </div>
    </div>
  );
}

/**
 * Botão de menu do duelo (hambúrguer): abre as opções (animações, som) e "Desistir", que pede confirmação. As
 * preferências são salvas por quem chama (`onSettings`).
 */
export function DuelMenu({ onSurrender, settings, onSettings }: { onSurrender: () => void; settings: Settings; onSettings: (s: Settings) => void }) {
  const [step, setStep] = useState<'closed' | 'menu' | 'confirm'>('closed');
  const close = () => setStep('closed');
  return (
    <>
      <button className="menubtn hud-btn" aria-label="Menu" onClick={() => setStep('menu')}>{burger}</button>
      {step !== 'closed' && (
        <div className="scrim center">
          <Backdrop onClose={close} />
          <div className="sheet hud">
            {step === 'menu'
              ? <>
                <h4>Menu</h4>
                <Choice label="Animações" options={ANIM} value={settings.anim} onPick={(anim) => onSettings({ ...settings, anim })} />
                <Choice label="Som" options={SOUND} value={settings.sound} onPick={(sound) => onSettings({ ...settings, sound })} />
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
