import { useState } from 'react';
import { BALANCE } from '../../campaign/balance';
import {
  bondChoiceScene, canTalk, choiceOf, bondEvent, chooseRoute, conversationScene, eventTitle, hearts, isChoicePending,
  playableEvent, talk, talkedToday, TOPIC_NAMES, TOPICS, type ConversationResult, type Topic,
} from '../../campaign/bond';
import type { Scene } from '../../campaign/data/types';
import { greetingScene, preDuelScene } from '../../campaign/encounter';
import { duelist as duelistData } from '../../campaign/decks';
import { canDuel } from '../../campaign/flow';
import { PERIOD_KEYS, type CampaignState, type DuelKind, type Route } from '../../campaign/state';
import type { Profile } from '../../story/profile';
import { GameIcon } from '../../ui/icons';
import { sceneBg } from './assets';
import type { CharInfo } from './chars';
import { Dialogue } from './Dialogue';
import { Hearts } from './MapScreen';

type Phase =
  | { k: 'greet' }
  | { k: 'menu' }
  | { k: 'topics' }
  | { k: 'talk'; result: ConversationResult }
  | { k: 'pre'; kind: DuelKind; scene: Scene }
  | { k: 'after'; scene: Scene }
  | { k: 'choice'; scene: Scene }
  | { k: 'then'; scene: Scene };

/**
 * O encontro com um duelista na cena dele (fundo e lugar pelo tier): saudação → menu (evento, Conversar, Duelar, Voltar) → conversa, fala de
 * antes do duelo, ou a escolha amizade/romance. Depois de um duelo, o App abre o encontro direto na fala de depois.
 */
export function EncounterScreen({ s, duelist, chars, profile, afterDuel, firstMeeting, onChange, onDuel, onLeave }: {
  s: CampaignState; duelist: string; chars: Record<string, CharInfo>; profile: Profile;
  /** A fala de depois do duelo (o encontro abre nela). */
  afterDuel?: Scene;
  /** Primeiro encontro com o duelista (o App já o marcou como conhecido): toca a saudação de primeiro encontro. */
  firstMeeting?: boolean;
  onChange: (s: CampaignState) => void; onDuel: (kind: DuelKind) => void; onLeave: () => void;
}) {
  const [phase, setPhase] = useState<Phase>(afterDuel ? { k: 'after', scene: afterDuel } : { k: 'greet' });
  const [greeting] = useState(() => greetingScene(s, duelist, firstMeeting));
  const data = duelistData(duelist);
  const name = data.name;
  const stage = { bg: sceneBg(data.scene.bg), period: PERIOD_KEYS[s.period], duelist };
  const wins = s.victories[duelist] ?? 0;
  // Voltar pela barra só fora das falas que levam ao duelo (como o nativo, que esconde o voltar nessas etapas).
  const canLeave = phase.k === 'greet' || phase.k === 'menu' || phase.k === 'topics' || phase.k === 'talk';
  const top = {
    title: data.scene.place,
    subtitle: `${name} · ${wins === 0 ? 'nenhuma vitória' : `${wins} vitória${wins > 1 ? 's' : ''}`}`,
    // Corações e conversa só para quem tem laço (os do Tier 1).
    hearts: data.bond ? hearts(s, duelist) : undefined,
    onBack: canLeave ? onLeave : undefined,
  };

  const event = playableEvent(s, duelist);
  const choicePending = isChoicePending(s, duelist);
  const menu = (
    <>
      {choicePending && (
        <button className="hud-btn primary" onClick={() => setPhase({ k: 'choice', scene: bondChoiceScene(s, duelist) ?? [] })}>
          <GameIcon name="heart" size={20} /> {eventTitle(duelist, BALANCE.bondChoiceEvent)}
        </button>
      )}
      {event !== null && (
        <button className="hud-btn primary" onClick={() => setPhase({ k: 'pre', kind: 'bondEvent', scene: preDuelScene(s, duelist, 'bondEvent') })}>
          <GameIcon name="heart" size={20} /> {eventTitle(duelist, event)}
        </button>
      )}
      {data.bond && (
        <button className="hud-btn secondary" disabled={!canTalk(s, duelist)} onClick={() => setPhase({ k: 'topics' })}>
          <GameIcon name="talk" size={20} /> {talkedToday(s, duelist) ? 'Conversar · volte amanhã' : 'Conversar'}
        </button>
      )}
      <button className={`hud-btn ${event !== null || choicePending ? 'secondary' : 'primary'}`} disabled={!canDuel(s, duelist, 'regular')}
        onClick={() => setPhase({ k: 'pre', kind: 'regular', scene: preDuelScene(s, duelist, 'regular') })}>
        <GameIcon name="duel" size={20} /> Duelar
      </button>
      <button className="hud-btn secondary" onClick={onLeave}><GameIcon name="campaign" size={20} /> Voltar ao mapa</button>
    </>
  );

  const pickTopic = (t: Topic) => {
    const r = talk(s, duelist, t);
    onChange(r.state);
    setPhase({ k: 'talk', result: r.result });
  };
  const choose = (route: Route) => {
    const r = chooseRoute(s, duelist, route);
    onChange(r.state);
    setPhase({ k: 'then', scene: r.then });
  };
  const choice = choiceOf(bondEvent(duelist, BALANCE.bondChoiceEvent));

  const common = { stage, chars, profile, top };
  switch (phase.k) {
    case 'greet':
      return <Dialogue {...common} scene={greeting} onDone={() => setPhase({ k: 'menu' })}>{menu}</Dialogue>;
    case 'menu':
      return <Dialogue {...common} scene={NONE} onDone={() => {}}>{menu}</Dialogue>;
    case 'topics':
      return (
        <Dialogue {...common} scene={NONE} onDone={() => {}}>
          {/* Como no nativo: os 4 temas em 2 fileiras, a dica dos Boatos e "Deixa pra lá" (volta ao menu). */}
          <p className="ask">Sobre o que conversar?</p>
          <div className="topicgrid">
            {TOPICS.map((t) => <button key={t} className="hud-btn secondary" onClick={() => pickTopic(t)}>{TOPIC_NAMES[t]}</button>)}
          </div>
          <p className="topichint">Boatos nunca desagradam, mas agradam pouco.</p>
          <button className="hud-btn danger" onClick={() => setPhase({ k: 'menu' })}><GameIcon name="close" size={18} /> Deixa pra lá</button>
        </Dialogue>
      );
    case 'talk': {
      const r = phase.result, pts = r.after - r.before;
      return (
        <Dialogue {...common} scene={conversationScene(duelist, r)} onDone={() => {}}>
          <p className={`bondchange ${pts > 0 ? 'up' : pts < 0 ? 'down' : ''}`}>
            {/* Os corações ficam só na placa do alto (que já mostra o valor novo); aqui, a mudança. */}
            <span className="num">{pts > 0 ? `+${pts}` : pts}</span> de afinidade
            {r.openedEvent !== null && <b> · Novo evento: {eventTitle(duelist, r.openedEvent)}</b>}
          </p>
          <button className="hud-btn primary" onClick={() => setPhase({ k: 'menu' })}>Continuar</button>
        </Dialogue>
      );
    }
    case 'pre':
      return <Dialogue key="pre" {...common} scene={phase.scene} onDone={() => onDuel(phase.kind)} />;
    case 'after':
      return <Dialogue key="after" {...common} scene={phase.scene}
        onDone={() => (isChoicePending(s, duelist) ? setPhase({ k: 'choice', scene: NONE }) : onLeave())} />;
    case 'choice':
      return (
        <Dialogue key="choice" {...common} scene={phase.scene} onDone={() => {}}>
          {choice ? (
            <>
              <button className="hud-btn secondary" onClick={() => choose('friendship')}>{choice.friendship.label}</button>
              <button className="hud-btn secondary" onClick={() => choose('romance')}>{choice.romance.label}</button>
            </>
          ) : <button className="hud-btn secondary" onClick={onLeave}>Voltar ao mapa</button>}
        </Dialogue>
      );
    case 'then':
      return <Dialogue key="then" {...common} scene={phase.scene} onDone={onLeave} />;
  }
}

const NONE: Scene = [];
