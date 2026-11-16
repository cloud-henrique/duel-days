/** Calendário: 30 dias de Manhã, Tarde e Noite. Só o duelo anda o tempo. */
import { BALANCE } from './balance';
import { CAMPAIGN } from './data/types';
import type { CampaignState, Period } from './state';

/** Avança um período (muda `s`; use num clone). Depois da noite do último dia, a campanha termina. */
export function advancePeriod(s: CampaignState) {
  if (s.period < 2) { s.period = (s.period + 1) as Period; return; }
  if (s.day < BALANCE.days) { s.day += 1; s.period = 0; return; }
  s.concluded = true;
}

export const daysLeft = (s: CampaignState) => BALANCE.days - s.day + 1;

/** Fração da barra dos dias no cabeçalho: (dia − 1) / (dias − 1). */
export const dayProgress = (s: CampaignState) => (s.day - 1) / (BALANCE.days - 1);

/** O tier 2 não existe: depois do dia 7 (ou do chefe vencido), o nativo avisa que o resto chega numa atualização. */
export const awaitsNextUpdate = (s: CampaignState) =>
  s.defeatedBosses.includes(CAMPAIGN.tier.number) || s.day > CAMPAIGN.tier.lastDay;
