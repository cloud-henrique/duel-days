/**
 * O som de toque dos botões, como no nativo (`Role.tapSound` do `GameButtonStyle`): **todo** botão fora do duelo toca o
 * `tap`, e os de voltar, fechar, cancelar e os de perigo tocam o `back`. Um só ouvinte no documento, para nenhuma tela
 * precisar lembrar de tocar o som. O duelo tem os sons dele (`.duel` fica de fora).
 *
 * - `data-sound="<som>"` no botão escolhe outro som (ex.: avançar a fala); `data-sound="none"` cala o toque.
 * - Botão desligado não dispara `click`, então não toca.
 */
import { sfx, type UiSound } from './sfx';

const BACK = /^(voltar|fechar|cancelar|deixa pra lá|sair)\b/i;

/** O som do toque num elemento (o botão mais próximo), ou null. */
export function soundForButton(target: Element | null): UiSound | null {
  const b = target?.closest('button');
  if (!b || b.closest('.duel')) return null;
  const chosen = b.getAttribute('data-sound');
  if (chosen === 'none') return null;
  if (chosen) return chosen as UiSound;
  const label = (b.getAttribute('aria-label') || b.textContent || '').trim();
  return b.classList.contains('danger') || BACK.test(label) ? 'back' : 'tap';
}

/** Liga o som de toque a todo botão do app. */
export function installButtonSounds(): () => void {
  const on = (e: Event) => { const s = soundForButton(e.target as Element | null); if (s) sfx.play(s); };
  document.addEventListener('click', on, { capture: true });
  return () => document.removeEventListener('click', on, { capture: true });
}
