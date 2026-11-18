import { useState, type CSSProperties } from 'react';
import { sfx } from '../../audio/sfx';
import { RARITY_NAME, type PackOpening, type Pull } from '../../campaign/packs';
import type { Rarity } from '../../campaign/data/types';
import { CardBack, CardFace } from '../../components/CardFace';
import { CardZoom } from '../../components/CardZoom';
import type { Cards } from '../../data/cards';
import { GameIcon } from '../../ui/icons';
import { TopBar } from '../../ui/TopBar';
import { sceneBg } from '../campaign/assets';
import {
  allFlipped, flip, isLast, newCount, next, revealAll, skipAll, startOpening, summaryOrder, tear,
  type OpeningSound, type OpeningState, type Step,
} from './opening';
import { PackCover } from './PackCover';
import { SHOP_PACING } from './pacing';

const RCLASS: Record<Rarity, string> = { common: 'N', rare: 'R', super: 'SR', ultra: 'UR' };
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * A abertura de pacotes em tela cheia (`PackOpeningView` + `BoxSummaryView` do nativo). A compra já gravou tudo: aqui
 * é só encenação. Um pacote: rasgar, virar (ou "Revelar tudo") e "Pronto". Vários (caixa): pacote a pacote, com "Abrir
 * todos" e o resumo no fim. "Fechar" sai a qualquer momento sem perder nada.
 */
export function OpeningFlow({ openings, packName, cards, reduced, onDone }: {
  openings: PackOpening[]; packName: string; cards: Cards; reduced: boolean; onDone: () => void;
}) {
  const [st, setSt] = useState<OpeningState>(() => startOpening(openings));
  const [tearing, setTearing] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const many = openings.length > 1;
  const apply = (step: Step) => { step.sounds.forEach((s: OpeningSound) => sfx.play(s)); setSt(step.state); };

  const doTear = () => {
    if (st.phase !== 'sealed' || tearing) return;
    sfx.play('tear');
    setTearing(true);
    setTimeout(() => { setTearing(false); setSt(tear(st).state); }, reduced ? 0 : SHOP_PACING.tearMs);
  };

  const vars = {
    '--tear-ms': `${SHOP_PACING.tearMs}ms`, '--flip-ms': `${SHOP_PACING.flipMs}ms`,
    '--deal-ms': `${SHOP_PACING.dealMs}ms`,
  } as CSSProperties;
  const novas = newCount(openings);
  const subtitle = many && st.phase !== 'summary' ? `Pacote ${st.index + 1} de ${openings.length}` : undefined;

  return (
    <div className={`opening app${reduced ? ' reduced' : ''}`} style={vars} role="dialog" aria-modal="true">
      <div className="openingbg" style={{ backgroundImage: sceneBg('loja-de-jogos') }} />
      <TopBar title={st.phase === 'summary' ? 'Resumo da caixa' : packName} subtitle={subtitle}
        right={<button className="hud-btn closebtn" onClick={onDone}><GameIcon name="close" size={18} /> Fechar</button>} />

      {st.phase === 'sealed' && (
        <div className="openingstage">
          <button key={st.index} type="button" className={`sealed${tearing ? ' tearing' : ''}`} data-sound="none" onClick={doTear}
            aria-label="Abrir o pacote">
            <PackCover k={openings[st.index].packKey} name={packName} />
            <span className="strip" aria-hidden="true" />
          </button>
          <p className="hint">Toque no pacote para abrir</p>
        </div>
      )}

      {st.phase === 'torn' && (
        <div className="openingstage">
          <div className="reveal" key={st.index}>
            {openings[st.index].pulls.map((p, i) => (
              <RevealCard key={i} pull={p} i={i} flipped={st.flipped[i]} cards={cards}
                onTap={() => (st.flipped[i] ? setZoom(p.id) : apply(flip(st, openings, i)))} />
            ))}
          </div>
          {allFlipped(st) && <p className="hint">Toque numa carta para ver os detalhes</p>}
        </div>
      )}

      {st.phase === 'summary' && <Summary pulls={summaryOrder(openings)} cards={cards} onOpen={setZoom} />}

      <div className="openingfoot">
        {(st.phase === 'summary' || (!many && allFlipped(st))) && (
          <p className="newsum">{novas ? `${plural(novas, 'carta nova', 'cartas novas')} na coleção!` : 'Nenhuma carta nova desta vez.'}</p>
        )}
        <div className="acts">
          {many && st.phase !== 'summary' && (
            <button className="hud-btn secondary" onClick={() => apply(skipAll(st, openings))}><GameIcon name="skip" size={18} /> Abrir todos</button>
          )}
          {st.phase === 'torn' && !allFlipped(st) && (
            <button className="hud-btn primary" onClick={() => apply(revealAll(st, openings))}><GameIcon name="revealAll" size={18} /> Revelar tudo</button>
          )}
          {many && allFlipped(st) && (
            <button className="hud-btn primary" onClick={() => apply(next(st, openings))}>
              <GameIcon name="next" size={18} /> {isLast(st, openings) ? 'Ver resumo' : 'Próximo pacote'}
            </button>
          )}
          {((!many && allFlipped(st)) || st.phase === 'summary') && (
            <button className="hud-btn primary" onClick={onDone}><GameIcon name="check" size={18} /> Pronto</button>
          )}
        </div>
      </div>

      {zoom != null && <CardZoom code={zoom} cards={cards} onClose={() => setZoom(null)} />}
    </div>
  );
}

/** Uma carta da abertura: entra de baixo de verso; virada, mostra a frente, o brilho e o rótulo da raridade. */
function RevealCard({ pull, i, flipped, cards, onTap }: { pull: Pull; i: number; flipped: boolean; cards: Cards; onTap: () => void }) {
  const r = RCLASS[pull.rarity];
  return (
    <div className={`revealcard r-${r}${flipped ? ' flipped' : ''}`} style={{ animationDelay: `${i * SHOP_PACING.dealStepMs}ms` }}>
      <button type="button" className="flipper" data-sound={flipped ? undefined : 'none'} onClick={onTap}
        aria-label={flipped ? `${cards[String(pull.id)]?.name ?? 'Carta'}, ${RARITY_NAME[pull.rarity]}` : `Virar a carta ${i + 1}`}>
        <span className="face back"><CardBack /></span>
        <span className="face front"><CardFace code={pull.id} card={cards[String(pull.id)]} /></span>
        {flipped && pull.isNew && <em className="nova">NOVA</em>}
      </button>
      <span className="rlabel">{flipped ? RARITY_NAME[pull.rarity] : ' '}</span>
    </div>
  );
}

/** O resumo da caixa: todas as cartas, da Ultra para a Comum, as raras com contorno. */
function Summary({ pulls, cards, onOpen }: { pulls: Pull[]; cards: Cards; onOpen: (id: number) => void }) {
  return (
    <div className="cardgrid summarygrid">
      {pulls.map((p, i) => (
        <button key={i} className={`cell r-${RCLASS[p.rarity]}`} onClick={() => onOpen(p.id)} aria-label={cards[String(p.id)]?.name}>
          <CardFace code={p.id} card={cards[String(p.id)]} />
          {p.isNew && <em className="nova">NOVA</em>}
        </button>
      ))}
    </div>
  );
}
