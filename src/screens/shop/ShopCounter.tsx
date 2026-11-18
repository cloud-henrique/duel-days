import { useEffect } from 'react';
import type { ShopLine } from '../../campaign/shopkeeper';
import { GameIcon } from '../../ui/icons';
import { CHAR_ID, type CharInfo } from '../campaign/chars';
import { Sprite } from '../campaign/Dialogue';
import { sceneBg } from '../campaign/assets';
import { SHOP_PACING } from './pacing';
import { useCountUp } from './useCountUp';

/**
 * O balcão da loja (o `ShopCounter` do nativo): o vovô atrás do balcão sobre o fundo da Loja de Jogos, o nome da loja,
 * o saldo (contando até o valor novo) e o balão de fala, que some sozinho ou com um toque. `compact` é o do detalhe do
 * pacote. O balão é um <button> (o iOS só entrega toques confiáveis a botões) e não cobre o resto da tela.
 */
export function ShopCounter({ size, balance, line, onDismiss, chars, reduced }: {
  size: 'tall' | 'compact'; balance: number; line: (ShopLine & { key: number }) | null; onDismiss: () => void;
  chars: Record<string, CharInfo>; reduced: boolean;
}) {
  const { shown, pulse } = useCountUp(balance, reduced);
  const keeper = chars[CHAR_ID.solomon];
  useEffect(() => {
    if (!line) return;
    const t = setTimeout(onDismiss, SHOP_PACING.speechMs);
    return () => clearTimeout(t);
  }, [line?.key]);
  return (
    <section className={`shopcounter hud ${size}${reduced ? ' reduced' : ''}`}>
      <div className="counterbg" style={{ backgroundImage: sceneBg('loja-de-jogos') }} />
      <div className="keeper">{keeper && <Sprite c={keeper} expr={line?.expression ?? 'happy'} side="solo" lit />}</div>
      <div className="desk" />
      <div className="counterinfo">
        {size === 'tall' && <b className="game-title">Loja de Jogos do Vovô</b>}
        <span className={`balance num${pulse ? ' pulse' : ''}`} aria-label={`${balance} DP`}>
          <GameIcon name="dp" size={size === 'tall' ? 24 : 20} /> {shown} DP
        </span>
      </div>
      {line && (
        <button key={line.key} type="button" className="speech" data-sound="none" onClick={onDismiss} aria-label={`Vovô: ${line.text}`}>
          {line.text}
        </button>
      )}
    </section>
  );
}
