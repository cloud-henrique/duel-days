import { useEffect, useState } from 'react';
import { DeckBuilder } from './screens/DeckBuilder';
import { DuelScreen } from './screens/duel/DuelScreen';
import { ShopScreen } from './screens/ShopScreen';
import { loadData, type GameData } from './data/cards';
import { randomDeck, starterCollection, validateDeck } from './game/decks';
import { LOSS_COINS, WIN_COINS } from './game/economy';
import { HubScreen } from './screens/HubScreen';
import { StoryScreen, type CharInfo } from './screens/StoryScreen';
import { advance, choose, isEnd, newState, resolveDuel, skip, type RunState } from './story/runner';
import { MAX_HEARTS, clearProgress, loadProgress, newProgress, withDefaults, writeProgress, type Progress } from './story/progress';
import { heartsOf, locationOf, pickScene, sceneById } from './story/world';
import { profileOf, type Profile } from './story/profile';
import { Welcome } from './screens/profile/Welcome';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { TitleScreen } from './screens/title/TitleScreen';
import { SettingsScreen } from './screens/title/SettingsScreen';
import { GameIcon } from './ui/icons';

const BASE = import.meta.env.BASE_URL;
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function App() {
  const [chars, setChars] = useState<Record<string, CharInfo> | null>(null);
  const [data, setData] = useState<GameData | null>(null);
  // Telas fora da história; `play` é o mapa, a cena ou o duelo. O deck volta para onde foi aberto (título ou mapa).
  const [view, setView] = useState<'title' | 'profile' | 'settings' | 'play' | 'decks' | 'shop'>('title');
  const [deckBack, setDeckBack] = useState<'title' | 'play'>('title');
  const [prog, setProg] = useState<Progress | null>(null);
  const [ready, setReady] = useState(false);
  // Entrou pelo título com a cena parada num duelo (o app fechou no meio dele): pergunta antes de recomeçá-lo.
  const [askResume, setAskResume] = useState(false);

  useEffect(() => {
    fetch(`${BASE}characters/index.json`).then((r) => r.json())
      .then((d: { characters: CharInfo[] }) => setChars(Object.fromEntries(d.characters.map((c) => [c.id, c]))))
      .catch(() => setChars({}));
    loadData().then(setData);
    loadProgress().then((p) => { setProg(p); setReady(true); });
  }, []);

  const save = (p: Progress) => { setProg(p); void writeProgress(p); };

  if (!ready || !chars || !data) return <div className="app hexbg"><div className="stats">Carregando…</div></div>;

  // Primeira abertura: boas-vindas (nome, avatar e tratamento) antes de qualquer outra tela.
  if (!prog) {
    return <Welcome onDone={(p: Profile) => {
      save({ ...newProgress(p.name, starterCollection(data.cards, data.tiers, Date.now() % 100000)), avatar: p.avatar, address: p.address });
      setView('title');
    }} />;
  }
  const profile = profileOf(prog);
  const toTitle = () => setView('title');
  const openDecks = (from: 'title' | 'play') => { setDeckBack(from); setView('decks'); };

  if (view === 'title') return <TitleScreen progress={prog} onPlay={() => {
    const run = prog.run;
    setAskResume(!!run && sceneById(run.scene).chapter.nodes[run.state.i]?.t === 'duel');
    setView('play');
  }} onDecks={() => openDecks('title')} onProfile={() => setView('profile')} onSettings={() => setView('settings')} />;
  if (view === 'profile') return <ProfileScreen progress={prog} onBack={toTitle} onChange={(p) => save({ ...prog, playerName: p.name, avatar: p.avatar, address: p.address })} />;
  if (view === 'settings') {
    return <SettingsScreen settings={withDefaults(prog.settings)} onSettings={(settings) => save({ ...prog, settings })} onBack={toTitle}
      onErase={async () => { await clearProgress(); setProg(null); setView('title'); }} />;
  }
  if (view === 'decks') return <DeckBuilder progress={prog} data={data} onChange={save} onBack={() => setView(deckBack)} />;
  if (view === 'shop') return <ShopScreen progress={prog} data={data} onChange={save} onBack={() => setView('play')} />;

  // Mapa
  if (!prog.run) {
    return <HubScreen progress={prog} chars={chars} onTitle={toTitle} onDecks={() => openDecks('play')} onShop={() => setView('shop')}
      onPick={(char) => { const sc = pickScene(char, prog); save({ ...prog, run: { scene: sc.id, state: newState(sc.chapter) } }); }} />;
  }

  // Cena
  const scene = sceneById(prog.run.scene);
  const ch = scene.chapter;
  const st = prog.run.state;
  const setRun = (state: RunState) => save({ ...prog, run: { scene: scene.id, state } });
  const node = ch.nodes[st.i];

  if (node?.t === 'duel' && askResume) {
    const foeName = chars[node.opponent]?.name ?? 'Oponente';
    return (
      <div className="app menu hexbg resume">
        <h1 className="game-title">Duelo interrompido</h1>
        <p>O duelo contra <b>{foeName}</b> em {locationOf(scene.location).name} ficou pela metade. Ele recomeça do início.</p>
        <button className="hud-btn primary" onClick={() => setAskResume(false)}><GameIcon name="duel" size={20} /> Duelar com {foeName}</button>
        <button className="hud-btn" onClick={() => { setAskResume(false); save({ ...prog, run: null }); }}><GameIcon name="campaign" size={20} /> Voltar ao mapa</button>
        <button className="hud-btn" onClick={toTitle}>Voltar ao título</button>
      </div>
    );
  }

  if (node?.t === 'duel') {
    const mine = prog.decks.find((d) => d.id === prog.activeDeck) ?? prog.decks[0];
    const problems = validateDeck(mine, data.cards, prog.collection);
    if (problems.length) {
      return (
        <div className="app menu hexbg">
          <h1>Deck inválido</h1>
          <div className="problems">{problems.slice(0, 4).map((p) => <div key={p}>• {p}</div>)}</div>
          <button className="hud-btn primary" onClick={() => openDecks('play')}>Montar deck</button>
          <button className="hud-btn" onClick={toTitle}>Voltar ao título</button>
        </div>
      );
    }
    return <DuelScreen key={`${scene.id}:${st.i}`} cards={data.cards}
      mine={{ main: mine.main, extra: mine.extra }} foe={randomDeck(data.cards, data.poolIds, hash(node.opponent))}
      opponent={{ id: node.opponent, name: chars[node.opponent]?.name ?? 'Oponente' }}
      player={{ id: profile.avatar, name: profile.name }}
      settings={withDefaults(prog.settings)} onSettings={(settings) => save({ ...prog, settings })}
      onEnd={(won) => save({
        ...prog,
        coins: prog.coins + (won ? WIN_COINS : LOSS_COINS),
        wins: won ? { ...prog.wins, [node.opponent]: (prog.wins[node.opponent] ?? 0) + 1 } : prog.wins,
        losses: won ? prog.losses : { ...prog.losses, [node.opponent]: (prog.losses[node.opponent] ?? 0) + 1 },
        run: { scene: scene.id, state: resolveDuel(ch, st, won) },
      })} />;
  }

  const finish = () => {
    const hearts = { ...prog.hearts };
    for (const [who, d] of Object.entries(st.gain)) hearts[who] = Math.min(MAX_HEARTS, (hearts[who] ?? 0) + d);
    save({ ...prog, hearts, seen: scene.once && !prog.seen.includes(scene.id) ? [...prog.seen, scene.id] : prog.seen, run: null });
  };
  const wins = prog.wins[scene.char] ?? 0;
  const charName = chars[scene.char]?.name ?? scene.char;

  return (
    <StoryScreen chapter={ch} state={st} chars={chars} playerName={prog.playerName}
      header={{ place: locationOf(scene.location).name, sub: `${charName} · ${wins === 0 ? 'nenhuma vitória' : `${wins} vitória${wins > 1 ? 's' : ''}`}`, hearts: heartsOf(prog, scene.char) }}
      bg={locationOf(scene.location).bg}
      onNext={() => setRun(advance(ch, st))} onChoose={(i) => setRun(choose(ch, st, i))} onSkip={() => setRun(skip(ch, st))}
      onFinish={() => (isEnd(ch, st) ? finish() : undefined)} onTitle={toTitle} />
  );
}
