import { useRef, useState } from 'react';
import { shopLine, type ShopLine, type ShopLineKind } from '../../campaign/shopkeeper';
import type { CampaignState } from '../../campaign/state';
import type { Profile } from '../../story/profile';

/**
 * A fala atual do vovô numa tela da loja. O contador junta o dia, o período e os pacotes abertos (outra visita, outra
 * fala) com as falas já ditas nesta tela; tudo pela semente da campanha.
 */
export function useSpeech(s: CampaignState, profile: Profile, first: ShopLineKind | null) {
  const said = useRef(0);
  const base = s.day * 31 + s.period * 7 + s.packsOpened;
  const make = (kind: ShopLineKind): ShopLine & { key: number } => {
    const n = said.current++;
    return { ...shopLine(kind, s.seed, base + n, profile), key: n };
  };
  const [line, setLine] = useState<(ShopLine & { key: number }) | null>(() => (first ? make(first) : null));
  return { line, say: (kind: ShopLineKind) => setLine(make(kind)), dismiss: () => setLine(null) };
}
