import { useEffect, useState } from 'react';
import { DuelScreen } from './screens/DuelScreen';
import { HubScreen } from './screens/HubScreen';
import { StoryScreen, type CharInfo } from './screens/StoryScreen';
import { advance, choose, isEnd, newState, resolveDuel, skip, type RunState } from './story/runner';
import { MAX_HEARTS, clearProgress, loadProgress, newProgress, writeProgress, type Progress } from './story/progress';
import { heartsOf, locationOf, pickScene, sceneById } from './story/world';

const BASE = import.meta.env.BASE_URL;

export function App() {
  const [chars, setChars] = useState<Record<string, CharInfo> | null>(null);
  const [prog, setProg] = useState<Progress | null>(null);
  const [playing, setPlaying] = useState(false); // false = tela de título
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch(`${BASE}characters/index.json`).then((r) => r.json())
      .then((d: { characters: CharInfo[] }) => setChars(Object.fromEntries(d.characters.map((c) => [c.id, c]))))
      .catch(() => setChars({}));
    loadProgress().then((p) => { setProg(p); setName(p?.playerName ?? ''); setReady(true); });
  }, []);

  const save = (p: Progress) => { setProg(p); void writeProgress(p); };

  if (!ready || !chars) return <div className="app hexbg"><div className="stats">Carregando…</div></div>;

  if (!playing || !prog) {
    return (
      <div className="app menu hexbg">
        <h1>YGO Story</h1>
        <p className="stats">protótipo</p>
        {prog && <button className="hud-btn primary" onClick={() => setPlaying(true)}>Continuar</button>}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={14} />
        <button className={`hud-btn ${prog ? '' : 'primary'}`} disabled={!name.trim()} onClick={() => { save(newProgress(name.trim())); setPlaying(true); }}>Novo jogo</button>
        {prog && <button className="hud-btn" onClick={async () => { await clearProgress(); setProg(null); }}>Apagar save</button>}
      </div>
    );
  }

  // Mapa
  if (!prog.run) {
    return <HubScreen progress={prog} chars={chars} onTitle={() => setPlaying(false)}
      onPick={(char) => { const sc = pickScene(char, prog); save({ ...prog, run: { scene: sc.id, state: newState(sc.chapter) } }); }} />;
  }

  // Cena
  const scene = sceneById(prog.run.scene);
  const ch = scene.chapter;
  const st = prog.run.state;
  const setRun = (state: RunState) => save({ ...prog, run: { scene: scene.id, state } });
  const node = ch.nodes[st.i];

  if (node?.t === 'duel') {
    return <DuelScreen key={`${scene.id}:${st.i}`}
      opponent={{ id: node.opponent, name: chars[node.opponent]?.name ?? 'Oponente' }}
      player={{ id: 'yugi_muto', name: prog.playerName }}
      onEnd={(won) => save({
        ...prog,
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
