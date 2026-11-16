import { useState } from 'react';
import { DEFAULT_AVATAR, cleanName, welcomeTitle, type Address, type Profile } from '../../story/profile';
import { AddressPicker, AvatarGrid, NameField } from './ProfileFields';
import { GameIcon } from '../../ui/icons';

/** Boas-vindas da primeira abertura (sem save): nome, avatar e tratamento, antes de qualquer outra tela. */
export function Welcome({ onDone }: { onDone: (p: Profile) => void }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [address, setAddress] = useState<Address>('neutral');
  const ok = cleanName(name).length > 0;
  return (
    <div className="app screen hexbg">
      <div className="screen-scroll">
        <h1 className="welcome-title game-title">{welcomeTitle(address)}</h1>
        <p className="stats welcome-sub">Antes de duelar, diga quem você é. Dá para trocar depois no perfil.</p>
        <section className="hud panelbox">
          <NameField value={name} onChange={setName} />
          <AvatarGrid value={avatar} onChange={setAvatar} />
          <AddressPicker value={address} onChange={setAddress} />
        </section>
      </div>
      <div className="screen-foot">
        <button className="hud-btn primary wide" disabled={!ok} onClick={() => onDone({ name: cleanName(name), avatar, address })}>
          <GameIcon name="start" /> Começar
        </button>
      </div>
    </div>
  );
}
