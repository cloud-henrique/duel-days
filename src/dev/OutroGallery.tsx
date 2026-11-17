/** Conferência em dev (`?outros`): o fim do duelo (vitória com recompensa da campanha, derrota e empate) e a abertura. */
import { useEffect, useState } from 'react';
import { Outro, type DuelResult } from '../screens/duel/anim/Outro';
import { Intro } from '../screens/duel/anim/Intro';
import { loadCards, type Cards } from '../data/cards';
import '../screens/duel/duel.css';
import '../screens/campaign/campaign.css';

const me = { id: 'npc_duelists_dm__hailey', name: 'Cláudio' }, foe = { id: 'tea_gardner', name: 'Tea' };
const reward = {
  baseDP: 300, bonuses: [{ label: 'Vida sobrando', dp: 60 }], totalDP: 360,
  cards: [{ id: 46986414, isNew: true }], bond: { before: 40, after: 70, perHeart: 100 }, notes: [],
};

export function OutroGallery() {
  const [cards, setCards] = useState<Cards>({});
  const [view, setView] = useState<DuelResult | 'intro'>('win');
  const [k, setK] = useState(0);
  useEffect(() => { loadCards().then(setCards); }, []);
  return (
    <div className="hexbg" style={{ position: 'fixed', inset: 0 }}>
      {view === 'intro'
        ? <Intro key={k} me={me} foe={foe} starter={0} reduced={false} onDone={() => setView('win')} />
        : <Outro key={view} result={view} detail={view === 'win' ? 'Você venceu!' : view === 'loss' ? 'Você perdeu.' : 'Empate.'} me={me} foe={foe}
            reward={view === 'win' ? reward : { ...reward, bonuses: [], totalDP: 60, cards: [], bond: null }} reduced={false} cards={cards}
            onContinue={() => { setK((x) => x + 1); setView(view === 'win' ? 'loss' : view === 'loss' ? 'draw' : 'intro'); }} />}
    </div>
  );
}
