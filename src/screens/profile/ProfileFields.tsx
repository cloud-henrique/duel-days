/** Os campos do perfil (boas-vindas e tela de perfil): nome, a grade de avatares e o tratamento. */
import { ADDRESSES, NAME_MAX, PLAYER_AVATARS, type Address } from '../../story/profile';

const BASE = import.meta.env.BASE_URL;
export const avatarFace = (id: string) => `${BASE}characters/${id}/neutral.webp`;

export function NameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="pfield">
      <span className="field-label game-title">Nome</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Seu nome" maxLength={NAME_MAX} autoComplete="off" />
    </label>
  );
}

export function AvatarGrid({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="pfield">
      <span className="field-label game-title">Avatar</span>
      <div className="avatargrid" role="radiogroup" aria-label="Avatar">
        {PLAYER_AVATARS.map((a) => (
          <button key={a.id} type="button" role="radio" aria-checked={a.id === value} aria-label={a.label}
            className={`avatar${a.id === value ? ' on' : ''}`} onClick={() => onChange(a.id)}>
            <img src={avatarFace(a.id)} alt="" draggable={false} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function AddressPicker({ value, onChange }: { value: Address; onChange: (a: Address) => void }) {
  return (
    <div className="pfield">
      <span className="field-label game-title">Como o jogo trata você</span>
      <div className="acts" role="radiogroup" aria-label="Tratamento">
        {ADDRESSES.map(([a, label]) => (
          <button key={a} type="button" role="radio" aria-checked={a === value} className={`hud-btn${a === value ? ' primary' : ''}`} onClick={() => onChange(a)}>{label}</button>
        ))}
      </div>
    </div>
  );
}
