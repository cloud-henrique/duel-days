import { Cards, Stack } from '@phosphor-icons/react';

/** Ícones da tela de duelo: Phosphor (como no nativo) e o indicador de espera próprio. */
export const Ico = {
  deck: <Stack size={22} weight="fill" />,
  hand: <Cards size={22} weight="fill" />,
  spin: <svg viewBox="0 0 24 24" width="40" height="40" className="spin"><g stroke="#cfd8e6" strokeWidth="2.6" strokeLinecap="round">{Array.from({ length: 8 }, (_, i) => <line key={i} x1="12" y1="2.5" x2="12" y2="7" opacity={0.25 + i * 0.1} transform={`rotate(${i * 45} 12 12)`} />)}</g></svg>,
};
