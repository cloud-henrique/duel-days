/**
 * Atalhos de conferência (só em dev ou com `?debug=1`): `?campaign=<preset>` muda a campanha ao abrir, como os argumentos
 * `-campaignBondCheck` e `-campaignLastEvening` do nativo.
 * - `last-evening`: noite do dia 30, com a Tea na rota de romance (4 eventos) e o Joey com 2: o próximo duelo encerra.
 * - `bond`: cada duelista num ponto do laço (Tristan com o 1º evento aberto, Tea na escolha, Joey com o 4º aberto).
 * - `boss`: os 4 comuns vencidos (o Yugi aparece) no dia 6, com 900 DP.
 * - `tier2`: dia 8, Tier 2 aberto pelo prazo, com 1500 DP.
 * - `pegasus`: dia 10 com os 5 comuns do Tier 2 vencidos (o Pegasus aparece).
 * - `tier3`: dia 15, Tier 3 aberto pelo prazo, com 2000 DP.
 * - `kaiba`: dia 18 com os 4 comuns do Tier 3 vencidos (o Kaiba aparece).
 * - `shop`: dia 4 do Tier 1 com 6000 DP (dá para a caixa) e os 3 pacotes ganhos, para conferir a loja.
 * - `all-cards`: a coleção com 3 cópias de cada carta da base (`poolIds`), para medir a grade do editor cheia.
 * - `speed-check` (change speed-duel): deck ativo de 20 com Polimerização + materiais (Flame Swordsman no Extra), Umi e
 *   cartas que banem (D.D. Warrior Lady, Soul Release, Bottomless Trap Hole), para conferir Fusão, Campo e banimento.
 * - `legacy-v1`: grava a campanha como versão 1 (a de antes do Speed Duel) e o app recarrega: o `migrate` a descarta.
 */
import { clone, newCampaign, type CampaignState } from './state';

export function debugPreset(name: string, s0: CampaignState | null, poolIds: readonly number[] = []): CampaignState | null {
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
      Object.assign(s, { day: 6, dp: 900, concluded: false });
      return s;
    case 'tier2':
      // Tier 2 aberto pelo prazo (dia 8), com DP para a loja.
      Object.assign(s, { day: 8, period: 0, dp: 1500, concluded: false });
      return s;
    case 'pegasus':
      // Os 5 comuns do Tier 2 vencidos: o Pegasus no mapa.
      Object.assign(s, { day: 10, period: 0, dp: 1500, concluded: false });
      for (const k of ['weevil', 'rex', 'mako', 'keith', 'mai']) s.victories[k] = Math.max(s.victories[k] ?? 0, 1);
      return s;
    case 'tier3':
      // Tier 3 aberto pelo prazo (dia 15), com DP para a loja.
      Object.assign(s, { day: 15, period: 0, dp: 2000, concluded: false });
      return s;
    case 'kaiba':
      // Os 4 comuns do Tier 3 vencidos: o Kaiba no mapa.
      Object.assign(s, { day: 18, period: 0, dp: 2000, concluded: false });
      for (const k of ['espa', 'rarehunter', 'arkana', 'strings']) s.victories[k] = Math.max(s.victories[k] ?? 0, 1);
      return s;
    case 'shop':
      Object.assign(s, { day: 4, period: 0, dp: 6000, concluded: false, unopenedPacks: ['lob', 'lob', 'lob'] });
      return s;
    case 'speed-check': {
      const deck = [[24094653, 3], [34460851, 3], [44287299, 3], [22702055, 3], [7572887, 3], [5758500, 2], [29401950, 3]]
        .flatMap(([id, n]) => Array<number>(n).fill(id));
      const extra = [45231177, 45231177];
      for (const id of [...deck, ...extra]) s.collection[String(id)] = (s.collection[String(id)] ?? 0) + 1;
      s.decks = [...s.decks.filter((d) => d.id !== 'speed-check'), { id: 'speed-check', name: 'Conferência Speed', main: deck, extra }];
      s.activeDeck = 'speed-check';
      return s;
    }
    case 'legacy-v1':
      return { ...s, version: 1 } as unknown as CampaignState;
    case 'all-cards':
      for (const id of poolIds) s.collection[String(id)] = 3;
      return s;
    default:
      return null;
  }
}
