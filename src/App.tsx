import { useEffect, useRef, useState } from 'react';
import { DeckEditor } from './screens/deck/DeckEditor';
import { CollectionScreen } from './screens/campaign/CollectionScreen';
import { DuelScreen, type DuelSummary } from './screens/duel/DuelScreen';
import type { OutroReward } from './screens/duel/anim/Outro';
import { ShopScreen } from './screens/shop/ShopScreen';
import { PackDetail } from './screens/shop/PackDetail';
import { loadData, type GameData } from './data/cards';
import { validateDeck } from './game/decks';
import { clearProgress, loadProgress, newProgress, withDefaults, writeProgress, type Progress } from './story/progress';
import { profileOf, type Profile } from './story/profile';
import { Welcome } from './screens/profile/Welcome';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { TitleScreen } from './screens/title/TitleScreen';
import { SettingsScreen } from './screens/title/SettingsScreen';
import { GameIcon } from './ui/icons';
import { music, type Track } from './audio/music';
import { BALANCE } from './campaign/balance';
import { epilogue, eventReview } from './campaign/bond';
import { debugPreset } from './campaign/debug';
import type { Scene } from './campaign/data/types';
import { duelist as duelistData, duelistDeck } from './campaign/decks';
import { abandonDuel, beginDuel, meet } from './campaign/flow';
import { packByKey } from './campaign/packs';
import { applyDuel, BONUS_NAMES, type DuelReward } from './campaign/rewards';
import { newSeed } from './campaign/rng';
import { activeDeckOf, newCampaign, PERIOD_KEYS, type CampaignState, type DuelKind } from './campaign/state';
import { preloadMaps, sceneBg } from './screens/campaign/assets';
import { CHAR_ID, type CharInfo } from './screens/campaign/chars';
import { Dialogue } from './screens/campaign/Dialogue';
import { EncounterScreen } from './screens/campaign/EncounterScreen';
import { MapScreen } from './screens/campaign/MapScreen';
import { BondsScreen } from './screens/campaign/BondsScreen';
import { StatusScreen } from './screens/campaign/StatusScreen';
import { CampaignEnd } from './screens/campaign/CampaignEnd';

const BASE = import.meta.env.BASE_URL;

/** A faixa de cada tela (a do fim do duelo, vitória ou derrota, quem escolhe é o `DuelScreen`). */
function trackFor(s: Screen): Track {
  switch (s.v) {
    case 'map': case 'decks': case 'collection': case 'bonds': case 'status': case 'end': return 'map';
    case 'shop': case 'shop-pack': return 'shop';
    case 'encounter': case 'scene': return 'encounter';
    case 'duel': return duelistData(s.duelist).isBoss ? 'boss-duel' : 'duel';
    default: return 'title';
  }
}

type Screen =
  | { v: 'title' } | { v: 'profile' } | { v: 'settings' } | { v: 'nodeck' }
  | { v: 'map' } | { v: 'shop' } | { v: 'shop-pack'; key: string } | { v: 'bonds' } | { v: 'status' } | { v: 'end' } | { v: 'resume' }
  | { v: 'decks'; back: Screen }
  | { v: 'collection'; back: Screen }
  | { v: 'encounter'; duelist: string; after?: Scene; first?: boolean }
  | { v: 'duel'; duelist: string; kind: DuelKind }
  /** Uma cena avulsa (rever evento, epílogo) no lugar do duelista; depois, `then`. */
  | { v: 'scene'; duelist: string; scene: Scene; then: Screen };

/** A recompensa do modelo no formato do encerramento do duelo. */
export function outroReward(r: DuelReward, duelistName: string): OutroReward {
  const labels = { drop: undefined, signature: 'Carta-assinatura', bondGift: 'Carta do laço' } as const;
  const notes: string[] = [];
  if (r.prizePack) notes.push(`Pacote ${packByKey(r.prizePack)?.name ?? r.prizePack} ganho (abra na loja)`);
  if (r.unlockedPack) notes.push(`Pacote de ${duelistName} liberado na loja`);
  const b = r.bond;
  const note = b?.completedTitle ? `Evento concluído: ${b.completedTitle}`
    : b?.openedTitle ? `Novo evento: ${b.openedTitle}`
    : b?.pendingTitle && !r.won ? `${b.pendingTitle}: tente de novo amanhã` : undefined;
  return {
    baseDP: r.baseDP, totalDP: r.totalDP,
    bonuses: r.bonuses.map((x) => ({ label: BONUS_NAMES[x.kind], dp: x.dp })),
    cards: r.cards.map((c) => ({ id: c.id, isNew: c.isNew, label: labels[c.kind] })),
    bond: b ? { before: b.before, after: b.after, perHeart: BALANCE.pointsPerHeart, note } : null,
    notes,
  };
}

export function App() {
  const [chars, setChars] = useState<Record<string, CharInfo> | null>(null);
  const [data, setData] = useState<GameData | null>(null);
  const [screen, setScreen] = useState<Screen>({ v: 'title' });
  const [prog, setProg] = useState<Progress | null>(null);
  const [ready, setReady] = useState(false);
  /** O resultado do duelo que acabou, calculado no encerramento e gravado no "Continuar". */
  const applied = useRef<ReturnType<typeof applyDuel> | null>(null);

  useEffect(() => {
    fetch(`${BASE}characters/index.json`).then((r) => r.json())
      .then((d: { characters: CharInfo[] }) => setChars(Object.fromEntries(d.characters.map((c) => [c.id, c]))))
      .catch(() => setChars({}));
    Promise.all([loadData(), loadProgress()]).then(([d, p]) => {
      setData(d);
      // Conferência (dev ou ?debug=1): ?campaign=last-evening|bond|boss|all-cards muda a campanha ao abrir.
      const q = new URLSearchParams(location.search);
      const preset = q.get('campaign');
      if (p && preset && (import.meta.env.DEV || q.has('debug'))) {
        const c = debugPreset(preset, p.campaign, d.poolIds);
        if (c) { p = { ...p, campaign: c }; void writeProgress(p); }
      }
      // O mapa da campanha já começa a ser decodificado na tela de título.
      if (p?.campaign) preloadMaps(PERIOD_KEYS[p.campaign.period]);
      setProg(p); setReady(true);
    });
  }, []);

  const save = (p: Progress) => { setProg(p); void writeProgress(p); };
  // Música: a faixa da tela e os ajustes (sem save, as boas-vindas usam a do título).
  useEffect(() => { music.setTrack(trackFor(screen)); }, [screen]);
  const ms = withDefaults(prog?.settings);
  useEffect(() => { music.setSettings(ms.music, ms.musicVolume); }, [ms.music, ms.musicVolume]);

  if (!ready || !chars || !data) return <div className="app hexbg"><div className="stats">Carregando…</div></div>;

  // Primeira abertura: boas-vindas (nome, avatar e tratamento) antes de qualquer outra tela.
  if (!prog) {
    return <Welcome onDone={(p: Profile) => { save({ ...newProgress(p.name), avatar: p.avatar, address: p.address }); setScreen({ v: 'title' }); }} />;
  }
  const profile = profileOf(prog);
  const settings = withDefaults(prog.settings);
  const c = prog.campaign;
  const setCampaign = (campaign: CampaignState) => save({ ...prog, campaign });
  const go = (s: Screen) => setScreen(s);
  const toTitle = () => go({ v: 'title' });
  const toMap = () => go({ v: 'map' });

  /** Entrar na campanha pelo título: começa uma se não houver; o fim, se acabou; a pergunta do duelo interrompido. */
  const enterCampaign = () => {
    if (!c) { setCampaign(newCampaign(newSeed())); return toMap(); }
    if (c.concluded) return go({ v: 'end' });
    if (c.pendingDuel) return go({ v: 'resume' });
    toMap();
  };

  // --- Fora da campanha ---
  if (screen.v === 'title') {
    return <TitleScreen progress={prog} onPlay={enterCampaign} onDecks={() => go(c ? { v: 'decks', back: { v: 'title' } } : { v: 'nodeck' })}
      onProfile={() => go({ v: 'profile' })} onSettings={() => go({ v: 'settings' })} />;
  }
  if (screen.v === 'profile') return <ProfileScreen progress={prog} onBack={toTitle} onChange={(p) => save({ ...prog, playerName: p.name, avatar: p.avatar, address: p.address })} />;
  if (screen.v === 'settings') {
    return <SettingsScreen settings={settings} onSettings={(s) => save({ ...prog, settings: s })} onBack={toTitle}
      onErase={async () => { await clearProgress(); setProg(null); toTitle(); }} />;
  }
  if (screen.v === 'nodeck' || !c) {
    return (
      <div className="app menu hexbg nodeck">
        <GameIcon name="deck" size={56} big />
        <h1 className="game-title">Meu deck</h1>
        <p>O seu deck nasce na campanha: ao começar, você recebe o deck inicial de 40 cartas e 3 pacotes para abrir.</p>
        <button className="hud-btn primary" onClick={enterCampaign}><GameIcon name="campaign" size={20} /> Começar a campanha</button>
        <button className="hud-btn" onClick={toTitle}>Voltar ao título</button>
      </div>
    );
  }

  // --- Campanha ---
  const restart = () => { setCampaign(newCampaign(newSeed())); toMap(); };
  /** Depois da fala de fim de duelo: o epílogo e o fim, se a campanha acabou; senão, o mapa. */
  const afterEncounter = () => {
    if (c.concluded) {
      const ep = epilogue(c);
      return go(ep ? { v: 'scene', duelist: ep.duelist.key, scene: ep.scene, then: { v: 'end' } } : { v: 'end' });
    }
    toMap();
  };

  switch (screen.v) {
    case 'decks':
      return <DeckEditor progress={c} data={data} onChange={setCampaign} onBack={() => go(screen.back)} />;
    case 'collection':
      return <CollectionScreen s={c} data={data} onBack={() => go(screen.back)} />;
    case 'shop':
      return <ShopScreen campaign={c} data={data} chars={chars} profile={profile} onChange={setCampaign} onBack={toMap}
        onPack={(key) => go({ v: 'shop-pack', key })} />;
    case 'shop-pack':
      return <PackDetail key={screen.key} packKey={screen.key} campaign={c} data={data} chars={chars} profile={profile}
        onChange={setCampaign} onBack={() => go({ v: 'shop' })} />;
    case 'bonds':
      return <BondsScreen s={c} onBack={toMap} onReview={(k, n) => go({ v: 'scene', duelist: k, scene: eventReview(c, k, n) ?? [], then: { v: 'bonds' } })} />;
    case 'status':
      return <StatusScreen s={c} onBack={toMap} onRestart={restart} />;
    case 'scene': {
      const { duelist, scene, then } = screen;
      return (
        <Dialogue key={`${duelist}:${scene.length}`} scene={scene} chars={chars} profile={profile} onDone={() => go(then)}
          top={{ title: duelistData(duelist).scene.place, subtitle: duelistData(duelist).name }}
          stage={{ bg: sceneBg(duelistData(duelist).scene.bg), period: PERIOD_KEYS[c.period], duelist }} />
      );
    }
    case 'end': {
      const ep = epilogue(c);
      return <CampaignEnd s={c} onTitle={toTitle} onRestart={restart} onCollection={() => go({ v: 'collection', back: { v: 'end' } })}
        onEpilogue={() => ep && go({ v: 'scene', duelist: ep.duelist.key, scene: ep.scene, then: { v: 'end' } })} />;
    }
    case 'resume': {
      const pd = c.pendingDuel;
      if (!pd) return mapView();
      const d = duelistData(pd.duelist);
      return (
        <div className="app menu hexbg resume">
          <h1 className="game-title">Duelo interrompido</h1>
          <p>O duelo contra <b>{d.name}</b> ficou pela metade. Ele recomeça do início, e o período não foi gasto.</p>
          <button className="hud-btn primary" onClick={() => go({ v: 'duel', duelist: pd.duelist, kind: pd.kind })}><GameIcon name="duel" size={20} /> Duelar com {d.name}</button>
          <button className="hud-btn" onClick={() => { setCampaign(abandonDuel(c)); toMap(); }}><GameIcon name="campaign" size={20} /> Voltar ao mapa</button>
          <button className="hud-btn" onClick={toTitle}>Voltar ao título</button>
        </div>
      );
    }
    case 'encounter':
      return (
        <EncounterScreen key={`${screen.duelist}:${screen.after ? 'after' : 'greet'}`} s={c} duelist={screen.duelist} chars={chars} profile={profile}
          afterDuel={screen.after} firstMeeting={screen.first} onChange={setCampaign}
          onLeave={screen.after ? afterEncounter : toMap}
          onDuel={(kind) => {
            const problems = validateDeck(activeDeckOf(c), data.cards, c.collection);
            if (problems.length) return go({ v: 'decks', back: { v: 'map' } });
            setCampaign(beginDuel(c, screen.duelist, kind));
            go({ v: 'duel', duelist: screen.duelist, kind });
          }} />
      );
    case 'duel': {
      const { duelist, kind } = screen;
      const d = duelistData(duelist);
      const mine = activeDeckOf(c);
      const foeId = CHAR_ID[duelist] ?? duelist;
      return (
        <DuelScreen key={`${c.day}:${c.period}:${duelist}`} cards={data.cards}
          mine={{ main: mine.main, extra: mine.extra }} foe={duelistDeck(duelist)}
          opponent={{ id: foeId, name: d.name }}
          player={{ id: profile.avatar, name: profile.name }}
          settings={settings} onSettings={(s) => save({ ...prog, settings: s })}
          rewardFor={(summary: DuelSummary) => {
            applied.current = applyDuel(c, duelist, kind, summary);
            return outroReward(applied.current.reward, d.name);
          }}
          onEnd={(summary) => {
            const r = applied.current ?? applyDuel(c, duelist, kind, summary);
            applied.current = null;
            const won = summary.result === 'win';
            save({
              ...prog, campaign: r.state,
              wins: won ? { ...prog.wins, [duelist]: (prog.wins[duelist] ?? 0) + 1 } : prog.wins,
              losses: won ? prog.losses : { ...prog.losses, [duelist]: (prog.losses[duelist] ?? 0) + 1 },
            });
            go({ v: 'encounter', duelist, after: r.after });
          }} />
      );
    }
    case 'map':
    default:
      return mapView();
  }

  function mapView() {
    return (
      <MapScreen s={c!} onTitle={toTitle} onShop={() => go({ v: 'shop' })} onDecks={() => go({ v: 'decks', back: { v: 'map' } })}
        onCollection={() => go({ v: 'collection', back: { v: 'map' } })}
        onBonds={() => go({ v: 'bonds' })} onStatus={() => go({ v: 'status' })}
        onMeet={(k) => { setCampaign(meet(c!, k)); go({ v: 'encounter', duelist: k, first: !c!.met.includes(k) }); }} />
    );
  }
}
