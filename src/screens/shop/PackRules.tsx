import { packRulesText } from '../../campaign/packs';
import { GameIcon } from '../../ui/icons';
import { Modal } from '../../ui/Modal';

/** "Como funcionam os pacotes?": a composição, as chances e a caixa, com os números do `BALANCE`. */
export function PackRules({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Como funcionam os pacotes?" onClose={onClose}>
      {packRulesText().map((t) => <p key={t}>{t}</p>)}
      <button className="hud-btn primary" onClick={onClose}><GameIcon name="check" size={18} /> Entendi</button>
    </Modal>
  );
}
