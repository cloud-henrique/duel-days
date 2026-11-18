import { useMemo, useState } from 'react';
import type { CampaignState } from '../../campaign/state';
import type { GameData } from '../../data/cards';
import { useStored } from './useStored';
import { DEFAULT_SORT, SORT_KEYS, filterCode, sortCodes, type Kind, type TrunkSort } from './trunk';
import type { Copy } from './TrunkGrid';

const isSort = (v: unknown): v is TrunkSort =>
  !!v && typeof v === 'object' && SORT_KEYS.includes((v as TrunkSort).key) && typeof (v as TrunkSort).reversed === 'boolean';

/**
 * O estado da maleta (ordem lembrada no aparelho, filtro e busca desta visita) e as cópias que ela mostra: cada cópia da
 * coleção, as primeiras de cada carta marcadas quando estão no deck (`used`).
 */
export function useTrunk(s: CampaignState, data: GameData, used: Record<number, number> = {}) {
  const [sort, setSort] = useStored<TrunkSort>('duel-days.trunk.sort', DEFAULT_SORT, isSort);
  const [kind, setKind] = useState<Kind>('all');
  const [query, setQuery] = useState('');
  const copies = useMemo<Copy[]>(() => {
    const codes = Object.keys(s.collection).map(Number).filter((id) => (s.collection[id] ?? 0) > 0 && filterCode(data.cards[id], kind, query));
    return sortCodes(codes, sort, { cards: data.cards, tiers: data.tiers, owned: s.collection, acquired: s.acquired })
      .flatMap((code) => Array.from({ length: s.collection[code] }, (_, n) => ({ code, n, inDeck: n < (used[code] ?? 0) })));
  }, [s.collection, s.acquired, data, kind, query, sort, used]);
  return { sort, setSort, kind, setKind, query, setQuery, copies, resetKey: `${sort.key}:${sort.reversed}:${kind}:${query}` };
}
