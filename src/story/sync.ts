/**
 * A sincronização do save com a nuvem (change save-na-nuvem), na parte pura: dado o save do aparelho e o da nuvem, o que
 * fazer. O motor (`syncEngine.ts`) faz os pedidos e chama isto.
 */
import type { RemoteSave } from '../../server/protocol';
import { CAMPAIGN_VERSION, PERIOD_NAMES } from '../campaign/state';
import { migrate, type LocalSave, type Progress } from './progress';

export type SyncAction =
  /** Nada a fazer: os dois estão iguais (ou não há nada dos dois lados). */
  | { kind: 'none' }
  /** Enviar o do aparelho (ou o apagar dele, com `progress` nulo) sobre a revisão `baseRev` da nuvem. */
  | { kind: 'push'; baseRev: number }
  /** Trocar o do aparelho pelo da nuvem (que pode ser uma lápide: apaga o do aparelho). */
  | { kind: 'pull'; remote: RemoteSave }
  /** Os dois andaram: o jogador escolhe. */
  | { kind: 'conflict'; remote: RemoteSave }
  /** A nuvem foi gravada por uma versão mais nova do jogo: não puxa nem envia até o app atualizar. */
  | { kind: 'update' };

/** A versão que vai com o envio: a do app, ou a da campanha, se o save guarda uma mais nova (ver `migrate`). */
export const versionOf = (p: Progress | null) => Math.max(CAMPAIGN_VERSION, p?.campaign?.version ?? 0);

/**
 * `remote` nulo: a conta nunca gravou (404). Um save de depuração nunca é enviado e cede ao da nuvem.
 *
 *   nuvem na mesma revisão do aparelho -> envia se houver pendência, senão nada
 *   nuvem andou, aparelho sem pendência -> puxa
 *   nuvem andou, aparelho com pendência -> conflito (a não ser que os dois tenham apagado)
 */
export function reconcile(local: LocalSave, remote: RemoteSave | null, appVersion = CAMPAIGN_VERSION): SyncAction {
  if (remote && remote.version > appVersion) return { kind: 'update' };
  // O save de depuração volta a ser o da conta (sem conta, fica como está).
  if (local.debug) return remote ? { kind: 'pull', remote } : { kind: 'none' };
  const { dirty } = local;
  if (!remote) return dirty && local.progress ? { kind: 'push', baseRev: 0 } : { kind: 'none' };
  if (remote.rev === local.baseRev) {
    if (!dirty) return { kind: 'none' };
    // Pendência de apagar sobre uma nuvem que já é lápide: nada a enviar.
    return local.progress === null && remote.data === null ? { kind: 'none' } : { kind: 'push', baseRev: remote.rev };
  }
  if (!dirty) return { kind: 'pull', remote };
  if (local.progress === null && remote.data === null) return { kind: 'pull', remote };
  return { kind: 'conflict', remote };
}

/** O save da nuvem lido como o do app (passa pelo `migrate`); a lápide é "sem save". */
export const remoteProgress = (r: RemoteSave): Progress | null => (r.data === null ? null : migrate(r.data));

/** O resumo de um lado na escolha do conflito. `null` em `progress`: o lado apagado. */
export interface SideSummary {
  erased: boolean;
  /** "Dia 5 · Tarde", "Campanha terminada" ou "Sem campanha". */
  when: string;
  dp: number | null;
  wins: number;
  /** Cartas diferentes na coleção. */
  cards: number | null;
  playerName: string | null;
  device: string;
  savedAt: number;
}

export function summarize(progress: Progress | null, device: string, savedAt: number): SideSummary {
  if (!progress) return { erased: true, when: 'Progresso apagado', dp: null, wins: 0, cards: null, playerName: null, device, savedAt };
  const c = progress.campaign;
  const when = !c ? 'Sem campanha' : c.concluded ? 'Campanha terminada' : `Dia ${c.day} · ${PERIOD_NAMES[c.period]}`;
  return {
    erased: false, when, dp: c ? c.dp : null,
    wins: Object.values(progress.wins).reduce((a, b) => a + b, 0),
    cards: c ? Object.values(c.collection).filter((n) => n > 0).length : null,
    playerName: progress.playerName, device, savedAt,
  };
}

/** "hoje, 14:05", "ontem, 22:10" ou "3 de mar., 09:00" (hora do aparelho). */
export function formatSavedAt(ms: number, now = Date.now()): string {
  const d = new Date(ms);
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(new Date(now)) - day(d)) / 86_400_000);
  if (diff === 0) return `hoje, ${time}`;
  if (diff === 1) return `ontem, ${time}`;
  return `${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}, ${time}`;
}
