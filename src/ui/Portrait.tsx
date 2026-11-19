import type { CSSProperties, Ref } from 'react';

export type PortraitTone = 'cyan' | 'gold' | 'dim';

/**
 * Retrato emoldurado do HUD (abertura e fim do duelo): chanfro, borda ciano com brilho; `gold` para quem venceu e
 * `dim` para quem perdeu. O brilho fica no invólucro, porque o clip-path do `.hud` corta o box-shadow.
 */
export function Portrait({ src, size = 84, tone = 'cyan', imgRef, onError }: { src: string; size?: number; tone?: PortraitTone; imgRef?: Ref<HTMLSpanElement>; onError?: () => void }) {
  return (
    <span ref={imgRef} className={`portrait ${tone}`} style={{ '--size': `${size}px` } as CSSProperties}>
      <span className="hud"><img key={src} src={src} alt="" onError={(e) => (onError ? onError() : ((e.target as HTMLImageElement).style.visibility = 'hidden'))} /></span>
    </span>
  );
}
