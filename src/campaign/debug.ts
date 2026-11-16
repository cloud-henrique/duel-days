/**
 * Atalhos de conferência (só em dev ou com `?debug=1`): `?campaign=<preset>` muda a campanha ao abrir, como os argumentos
 * `-campaignBondCheck` e `-campaignLastEvening` do nativo.
 * - `last-evening`: noite do dia 30, com a Tea na rota de romance (4 eventos) e o Joey com 2: o próximo duelo encerra.
 * - `bond`: cada duelista num ponto do laço (Tristan com o 1º evento aberto, Tea na escolha, Joey com o 4º aberto).
 * - `boss`: os 4 comuns vencidos (o Yugi aparece) no dia 6, com 900 DP.
 */
import { clone, newCampaign, type CampaignState } from './state';

export function debugPreset(name: string, s0: CampaignState | null): CampaignState | null {
  const s = clone(s0 ?? newCampaign(12345));
  const beatAll = () => { for (const k of ['tristan', 'tea', 'joey', 'bakura']) s.victories[k] = Math.max(s.victories[k] ?? 0, 1); };
  switch (name) {
    case 'last-evening':
      Object.assign(s, { day: 30, period: 2, dp: 1200 });
      beatAll();
      s.met = ['tristan', 'tea', 'joey', 'bakura'];
      Object.assign(s.affinity, { tea: 400, joey: 200 });
      Object.assign(s.bondEventsDone, { tea: 4, joey: 2 });
      s.bondRoutes.tea = 'romance';
      return s;
    case 'bond':
      beatAll();
      s.met = ['tristan', 'tea', 'joey', 'bakura'];
      Object.assign(s.affinity, { tristan: 100, tea: 300, joey: 400, bakura: 210 });
      Object.assign(s.bondEventsDone, { tea: 3, joey: 3 });
      s.bondRoutes.joey = 'friendship';
      return s;
    case 'boss':
      beatAll();
      Object.assign(s, { day: 6, dp: 900 });
      return s;
    default:
      return null;
  }
}
