import { formatSavedAt } from '../../story/sync';
import type { SyncState } from '../../story/syncEngine';
import type { GameIconName } from '../../ui/icons';

/** O indicador: ícone, texto curto e a explicação por extenso de cada estado. */
export function syncLabel(s: SyncState, now = Date.now()): { icon: GameIconName; short: string; long: string; tone: 'ok' | 'busy' | 'warn' | 'off' } {
  const last = s.lastSync ? ` Última sincronização: ${formatSavedAt(s.lastSync, now)}.` : '';
  switch (s.status) {
    case 'checking':
    case 'syncing':
      return { icon: 'syncing', short: 'Sincronizando', long: 'Enviando e buscando o seu progresso na nuvem.', tone: 'busy' };
    case 'synced':
      return { icon: 'syncOk', short: 'Na nuvem', long: `O seu progresso está salvo na sua conta e continua em qualquer aparelho.${last}`, tone: 'ok' };
    case 'pending':
      return { icon: 'syncOffline', short: 'Pendente', long: `Há progresso que ainda não foi para a nuvem. Ele vai sozinho quando houver internet; até lá, fica salvo neste aparelho.${last}`, tone: 'warn' };
    case 'expired':
      return { icon: 'syncAlert', short: 'Entrar', long: 'A sua sessão venceu. Entre de novo para sincronizar: o jogo recarrega e pede o código enviado ao seu e-mail. O progresso deste aparelho continua salvo.', tone: 'warn' };
    case 'conflict':
      return { icon: 'syncAlert', short: 'Escolher save', long: 'Este aparelho e a nuvem avançaram separados. Escolha qual save continua.', tone: 'warn' };
    case 'update':
      return { icon: 'syncAlert', short: 'Atualizar o app', long: 'A nuvem tem um save de uma versão mais nova do jogo. Atualize o app para sincronizar; nada foi perdido.', tone: 'warn' };
    case 'off':
    default: {
      const why = s.offReason === 'debug' ? 'Há uma campanha de depuração aberta: a sua conta fica como estava.'
        : s.offReason === 'local' ? 'Este servidor não tem a nuvem (modo de desenvolvimento).'
        : 'A sincronização foi desligada pelo endereço.';
      return { icon: 'syncOff', short: 'Nuvem desligada', long: `${why} O progresso fica só neste aparelho.`, tone: 'off' };
    }
  }
}
