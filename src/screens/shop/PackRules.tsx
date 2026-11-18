import { packRulesText } from '../../campaign/packs';
import { Backdrop } from '../../components/CardSheet';
import { GameIcon } from '../../ui/icons';

/** "Como funcionam os pacotes?": a composição, as chances e a caixa, com os números do `BALANCE`. */
export function PackRules({ onClose }: { onClose: () => void }) {
  return (
    <div className="shopmodal" role="dialog" aria-modal="true" aria-labelledby="packrules-title">
      <Backdrop onClose={onClose} />
      <div className="hud panelbox shopdialog">
        <h4 id="packrules-title" className="game-title">Como funcionam os pacotes?</h4>
        {packRulesText().map((t) => <p key={t}>{t}</p>)}
        <button className="hud-btn primary" onClick={onClose}><GameIcon name="check" size={18} /> Entendi</button>
      </div>
    </div>
  );
}
