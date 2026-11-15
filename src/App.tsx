import { useCallback, useEffect, useState } from 'react';
import { DuelScreen } from './screens/DuelScreen';
import { StoryScreen, type CharInfo } from './screens/StoryScreen';
import { advance, choose, newState, resolveDuel, type Chapter, type RunState } from './story/runner';
import { ch1 } from './story/chapters/ch1';
import { clearSave, loadSave, writeSave } from './story/save';

const CHAPTERS: Record<string, Chapter> = { [ch1.id]: ch1 };
const BASE = import.meta.env.BASE_URL;

export function App() {
  const [chars, setChars] = useState<Record<string, CharInfo> | null>(null);
  const [save, setSave] = useState<RunState | null>(null);
  const [st, setSt] = useState<RunState | null>(null); // null = menu
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch(`${BASE}characters/index.json`).then((r) => r.json())
      .then((d: { characters: CharInfo[] }) => setChars(Object.fromEntries(d.characters.map((c) => [c.id, c]))))
      .catch(() => setChars({}));
    loadSave().then((s) => { setSave(s); setReady(true); });
  }, []);

  const update = useCallback((next: RunState) => { setSt(next); setSave(next); void writeSave(next); }, []);

  if (!ready || !chars) return <div className="app"><div className="stats">Carregando…</div></div>;

  if (!st) {
    return (
      <div className="app menu">
        <h1>YGO Story</h1>
        <p className="stats">protótipo</p>
        {save && <button className="primary" onClick={() => setSt(save)}>Continuar</button>}
        <button className={save ? '' : 'primary'} onClick={() => update(newState(ch1))}>Novo jogo</button>
        {save && <button onClick={async () => { await clearSave(); setSave(null); }}>Apagar save</button>}
      </div>
    );
  }

  const ch = CHAPTERS[st.chapter];
  const node = ch.nodes[st.i];
  if (node?.t === 'duel') {
    return <DuelScreen key={st.i} opponent={{ id: node.opponent, name: chars[node.opponent]?.name ?? 'Oponente' }} onEnd={(won) => update(resolveDuel(ch, st, won))} />;
  }
  return (
    <StoryScreen chapter={ch} state={st} chars={chars}
      onNext={() => update(advance(ch, st))} onChoose={(i) => update(choose(ch, st, i))} onMenu={() => setSt(null)} />
  );
}
