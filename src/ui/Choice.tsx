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

/** As preferências do app inteiro (animações e som), as mesmas no título e no duelo. */
export function SettingsChoices({ settings, onSettings }: { settings: Settings; onSettings: (s: Settings) => void }) {
  return (
    <>
      <Choice label="Animações" options={ANIM} value={settings.anim} onPick={(anim) => onSettings({ ...settings, anim })} />
      <Choice label="Som" options={SOUND} value={settings.sound} onPick={(sound) => onSettings({ ...settings, sound })} />
    </>
  );
}
