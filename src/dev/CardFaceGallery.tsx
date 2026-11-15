import { useEffect, useState } from 'react';
import { CardFace } from '../components/CardFace';
import { loadCards, type Cards } from '../data/cards';

/** Larguras reais em que a face aparece: verso do oponente, zona do campo e carta da mão. */
const WIDTHS = [24, 61, 91];
const LONGEST = 20;

/**
 * Página de conferência da face própria (só em desenvolvimento, `?cardfaces`): os nomes mais longos do pool e um
 * exemplo de cada moldura, nas larguras usadas no duelo.
 */
export function CardFaceGallery() {
  const [cards, setCards] = useState<Cards | null>(null);
  useEffect(() => { loadCards().then(setCards); }, []);
  if (!cards) return <p>Carregando…</p>;
  const all = Object.entries(cards);
  const longest = [...all].sort(([, a], [, b]) => b.name.length - a.name.length).slice(0, LONGEST);
  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', height: '100%', background: '#050a18' }}>
      {WIDTHS.map((w) => (
        <div key={w} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {longest.map(([id, c]) => <div key={id} style={{ width: w }}><CardFace code={Number(id)} card={c} /></div>)}
        </div>
      ))}
    </div>
  );
}
