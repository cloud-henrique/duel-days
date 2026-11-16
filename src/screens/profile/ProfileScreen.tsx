import { useState } from 'react';
import { cleanName, playerStats, profileOf, type Profile } from '../../story/profile';
import type { Progress } from '../../story/progress';
import { AddressPicker, AvatarGrid, NameField } from './ProfileFields';
import { TopBar } from '../../ui/TopBar';

/** Tela de perfil: troca nome, avatar e tratamento (vale na hora) e mostra vitórias, derrotas e aproveitamento. */
export function ProfileScreen({ progress, onChange, onBack }: { progress: Progress; onChange: (p: Profile) => void; onBack: () => void }) {
  const profile = profileOf(progress);
  const [name, setName] = useState(profile.name);
  const stats = playerStats(progress);
  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch });
  return (
    <div className="app screen hexbg">
      <TopBar title="Perfil" onBack={onBack} />
      <div className="screen-scroll">
        <section className="statrow hud" aria-label="Estatísticas">
          <div><b className="num win">{stats.wins}</b><span>Vitórias</span></div>
          <div><b className="num loss">{stats.losses}</b><span>Derrotas</span></div>
          <div><b className="num">{stats.rate == null ? '–' : `${stats.rate}%`}</b><span>Aproveitamento</span></div>
        </section>
        <section className="hud panelbox">
          <NameField value={name} onChange={(v) => { setName(v); if (cleanName(v)) set({ name: cleanName(v) }); }} />
          <AvatarGrid value={profile.avatar} onChange={(avatar) => set({ avatar })} />
          <AddressPicker value={profile.address} onChange={(address) => set({ address })} />
        </section>
      </div>
    </div>
  );
}
