import { BALANCE } from '../../campaign/balance';
import { eventsDone, eventTitle, hearts, needsAttention, ROUTE_NAMES, storyDuelists } from '../../campaign/bond';
import type { CampaignState } from '../../campaign/state';
import { GameIcon } from '../../ui/icons';
import { faceOf } from './assets';
import { TopBar } from '../../ui/TopBar';
import { Hearts } from './MapScreen';

/** Laços: os duelistas já encontrados, com corações, rota e os eventos vencidos (que dá para rever). */
export function BondsScreen({ s, onReview, onBack }: { s: CampaignState; onReview: (duelist: string, n: number) => void; onBack: () => void }) {
  const met = storyDuelists().filter((d) => s.met.includes(d.key));
  return (
    <div className="app deckb hexbg bonds">
      <TopBar title="Laços" onBack={onBack}
        subtitle={met.length ? `${met.length} de ${storyDuelists().length} amigos conhecidos` : 'Amizade e romance'} />
      {met.length === 0 && <p className="stats empty">Encontre os duelistas pela cidade para começar um laço.</p>}
      <div className="bondlist">
        {met.map((d) => {
          const done = eventsDone(s, d.key), route = s.bondRoutes[d.key];
          return (
            <section key={d.key} className="bondcard hud">
              <header>
                <img src={faceOf(d.key)} alt="" />
                <span><b>{d.name}</b><Hearts value={hearts(s, d.key)} size={16} /></span>
                {route && <em className={`route ${route}`}>{ROUTE_NAMES[route]}</em>}
                {needsAttention(s, d.key) && <b className="bondalert">!</b>}
              </header>
              <ol>
                {Array.from({ length: BALANCE.bondEvents }, (_, i) => i + 1).map((n) => (
                  <li key={n} className={n <= done ? 'done' : ''}>
                    <span>{n <= done ? eventTitle(d.key, n) : '???'}</span>
                    {n <= done && <button className="hud-btn" onClick={() => onReview(d.key, n)}>Rever</button>}
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
