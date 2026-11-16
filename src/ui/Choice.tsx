import type { Settings } from '../story/progress';

/** Uma linha de opções exclusivas (a escolhida fica marcada). Usada nos ajustes do título e no menu do duelo. */
export function Choice<T>({ label, options, value, onPick }: { label: string; options: [T, string][]; value: T; onPick: (v: T) => void }) {
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

const ANIM: [Settings['anim'], string][] = [['normal', 'Normal'], ['fast', 'Rápida'], ['off', 'Desligada']];
const SOUND: [boolean, string][] = [[true, 'Ligado'], [false, 'Desligado']];
const MUSIC: [boolean, string][] = [[true, 'Ligada'], [false, 'Desligada']];
const VOLUME: [number, string][] = [[0.3, 'Baixo'], [0.6, 'Médio'], [1, 'Alto']];
/** O nível mais perto do volume salvo (a escolha é em três degraus). */
const nearest = (v: number) => VOLUME.reduce((a, b) => (Math.abs(b[0] - v) < Math.abs(a[0] - v) ? b : a))[0];

/** As preferências do app inteiro (animações, efeitos e música), as mesmas no título e no duelo. */
export function SettingsChoices({ settings, onSettings }: { settings: Settings; onSettings: (s: Settings) => void }) {
  return (
    <>
      <Choice label="Animações" options={ANIM} value={settings.anim} onPick={(anim) => onSettings({ ...settings, anim })} />
      <Choice label="Som" options={SOUND} value={settings.sound} onPick={(sound) => onSettings({ ...settings, sound })} />
      <Choice label="Música" options={MUSIC} value={settings.music} onPick={(m) => onSettings({ ...settings, music: m })} />
      {settings.music && <Choice label="Volume da música" options={VOLUME} value={nearest(settings.musicVolume)} onPick={(musicVolume) => onSettings({ ...settings, musicVolume })} />}
    </>
  );
}
