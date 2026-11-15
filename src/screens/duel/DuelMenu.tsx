import { useState } from 'react';
import { List } from '@phosphor-icons/react';
import { Backdrop } from '../../components/CardSheet';

const burger = <List size={24} weight="bold" aria-hidden="true" />;

/** Botão de menu do duelo (hambúrguer): abre as opções; "Desistir" pede confirmação. */
export function DuelMenu({ onSurrender }: { onSurrender: () => void }) {
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
