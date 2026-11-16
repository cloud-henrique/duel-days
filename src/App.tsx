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
import { MAX_HEARTS, clearProgress, loadProgress, newProgress, writeProgress, type Progress } from './story/progress';
import { heartsOf, locationOf, pickScene, sceneById } from './story/world';

const BASE = import.meta.env.BASE_URL;
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function App() {
  const [chars, setChars] = useState<Record<string, CharInfo> | null>(null);
  const [data, setData] = useState<GameData | null>(null);
  const [screen, setScreen] = useState<'main' | 'decks' | 'shop'>('main');
  const [prog, setProg] = useState<Progress | null>(null);
  const [playing, setPlaying] = useState(false); // false = tela de título
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch(`${BASE}characters/index.json`).then((r) => r.json())
      .then((d: { characters: CharInfo[] }) => setChars(Object.fromEntries(d.characters.map((c) => [c.id, c]))))
      .catch(() => setChars({}));
    loadData().then(setData);
    loadProgress().then((p) => { setProg(p); setName(p?.playerName ?? ''); setReady(true); });
  }, []);

  const save = (p: Progress) => { setProg(p); void writeProgress(p); };

  if (!ready || !chars || !data) return <div className="app hexbg"><div className="stats">Carregando…</div></div>;

  if (!playing || !prog) {
    return (
      <div className="app menu hexbg">
        <h1>Duel Days</h1>
        <p className="stats">protótipo</p>
        {prog && <button className="hud-btn primary" onClick={() => setPlaying(true)}>Continuar</button>}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={14} />
        <button className={`hud-btn ${prog ? '' : 'primary'}`} disabled={!name.trim()} onClick={() => { save(newProgress(name.trim(), starterCollection(data.cards, data.tiers, Date.now() % 100000))); setScreen('main'); setPlaying(true); }}>Novo jogo</button>
        {prog && <button className="hud-btn" onClick={async () => { await clearProgress(); setProg(null); }}>Apagar save</button>}
      </div>
    );
  }

  if (screen === 'decks') return <DeckBuilder progress={prog} data={data} onChange={save} onBack={() => setScreen('main')} />;
  if (screen === 'shop') return <ShopScreen progress={prog} data={data} onChange={save} onBack={() => setScreen('main')} />;

  // Mapa
  if (!prog.run) {
    return <HubScreen progress={prog} chars={chars} onTitle={() => setPlaying(false)} onDecks={() => setScreen('decks')} onShop={() => setScreen('shop')}
      onPick={(char) => { const sc = pickScene(char, prog); save({ ...prog, run: { scene: sc.id, state: newState(sc.chapter) } }); }} />;
  }

  // Cena
  const scene = sceneById(prog.run.scene);
  const ch = scene.chapter;
  const st = prog.run.state;
  const setRun = (state: RunState) => save({ ...prog, run: { scene: scene.id, state } });
  const node = ch.nodes[st.i];

  if (node?.t === 'duel') {
    const mine = prog.decks.find((d) => d.id === prog.activeDeck) ?? prog.decks[0];
    const problems = validateDeck(mine, data.cards, prog.collection);
    if (problems.length) {
      return (
        <div className="app menu hexbg">
          <h1>Deck inválido</h1>
          <div className="problems">{problems.slice(0, 4).map((p) => <div key={p}>• {p}</div>)}</div>
          <button className="hud-btn primary" onClick={() => setScreen('decks')}>Montar deck</button>
          <button className="hud-btn" onClick={() => setPlaying(false)}>Voltar ao título</button>
        </div>
      );
    }
    return <DuelScreen key={`${scene.id}:${st.i}`} cards={data.cards}
      mine={{ main: mine.main, extra: mine.extra }} foe={randomDeck(data.cards, data.poolIds, hash(node.opponent))}
      opponent={{ id: node.opponent, name: chars[node.opponent]?.name ?? 'Oponente' }}
      player={{ id: 'yugi_muto', name: prog.playerName }}
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
      onFinish={() => (isEnd(ch, st) ? finish() : undefined)} onTitle={() => setPlaying(false)} />
  );
}
