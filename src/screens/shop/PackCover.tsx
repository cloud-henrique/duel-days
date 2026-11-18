import { useState } from 'react';
import { GameIcon } from '../../ui/icons';
import { packImage } from '../campaign/assets';

/** A capa do pacote (`pack-<chave>.jpg`, fora do git) ou, sem o arquivo, um envelope desenhado com o nome. */
export function PackCover({ k, name, className = '' }: { k: string; name: string; className?: string }) {
  const [ok, setOk] = useState(true);
  return (
    <div className={`packcover ${className}`}>
      {ok
        ? <img src={packImage(k)} alt="" draggable={false} onError={() => setOk(false)} />
        : <span className="packart"><GameIcon name="pack" size={28} /><small>{name}</small></span>}
    </div>
  );
}
