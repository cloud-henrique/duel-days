import { useState } from 'react';
import { packByKey } from '../../campaign/packs';
import { duelistByKey } from '../../campaign/data/types';
import { art } from '../../components/art';
import { GameIcon } from '../../ui/icons';
import { packImage } from '../campaign/assets';
import { CHAR_ID, speakerColor } from '../campaign/chars';

const BASE = import.meta.env.BASE_URL;
/** O rosto do medalhão: o mais simpático que o sprite tem (sem par, o neutro). */
const COVER_FACE: Record<string, string> = { tristan: 'happy', tea: 'laugh', joey: 'laugh' };

/**
 * A capa do pacote. Pacote de personagem: desenhada pelo jogo (a ilustração da carta-assinatura no alto, o rosto do
 * duelista num medalhão na cor dele e o nome). Coleção: `pack-<chave>.jpg` (fora do git) ou, sem o arquivo, um
 * envelope desenhado com o nome.
 */
export function PackCover({ k, name, className = '' }: { k: string; name: string; className?: string }) {
  const [ok, setOk] = useState(true);
  const duelist = duelistByKey(packByKey(k)?.duelist ?? '');
  if (duelist) return <CharacterCover k={duelist.key} card={duelist.signatureCard.id} name={name} className={className} />;
  return (
    <div className={`packcover ${className}`}>
      {ok
        ? <img src={packImage(k)} alt="" draggable={false} onError={() => setOk(false)} />
        : <span className="packart"><GameIcon name="pack" size={28} /><small>{name}</small></span>}
    </div>
  );
}

function CharacterCover({ k, card, name, className }: { k: string; card: number; name: string; className: string }) {
  const [face, setFace] = useState(true);
  const dir = CHAR_ID[k] ?? k;
  return (
    <div className={`packcover charcover ${className}`} style={{ '--c': speakerColor(k) } as React.CSSProperties}>
      <div className="ccart" style={{ backgroundImage: `url(${art(card, 'full')})` }} />
      <div className="ccstripe" />
      {face && (
        <div className="ccbadge">
          <img src={`${BASE}characters/${dir}/${COVER_FACE[k] ?? 'neutral'}.webp`} alt="" draggable={false}
            onError={() => setFace(false)} />
        </div>
      )}
      <div className={`cctext${name.length > 16 ? ' long' : ''}`}><b>{name}</b><small>Pacote de personagem</small></div>
    </div>
  );
}
