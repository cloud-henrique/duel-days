import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { Line, Scene } from '../../campaign/data/types';
import { fillText } from '../../campaign/text';
import type { Profile } from '../../story/profile';
import { BondHearts } from '../../ui/BondHearts';
import { GameIcon } from '../../ui/icons';
import { TopBar } from '../../ui/TopBar';
import { CHAR_ID, expressionFor, speakerColor, type CharInfo } from './chars';

const BASE = import.meta.env.BASE_URL;

/** Carrega e decodifica uma imagem fora da tela; resolve também no erro (arquivo faltando não trava o palco). */
function preload(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => resolve()); };
    img.onerror = () => resolve();
    img.src = src;
  });
}

/**
 * Quem já apareceu no palco neste encontro (ou cena avulsa): id do sprite → o último rosto mostrado. Cada fase do
 * encontro é um `Dialogue` novo (com `key`); sem a memória, o personagem entraria de novo a cada fase. Com ela, ele já
 * monta pronto, com o último rosto (que está em cache), e troca para o da fala nova quando carregar. Sem provedor, todo
 * `Sprite` entra.
 */
const StageMemoryContext = createContext<Map<string, string> | null>(null);

/** Envolve as fases de um encontro: a entrada de cada personagem toca só na primeira aparição dele ali. */
export function StageMemory({ children }: { children: ReactNode }) {
  const [seen] = useState(() => new Map<string, string>());
  return <StageMemoryContext.Provider value={seen}>{children}</StageMemoryContext.Provider>;
}

/**
 * Um personagem de corpo inteiro no palco: o corpo e o rosto da expressão por cima. Só aparece quando os dois já estão
 * carregados (senão o corpo surgia sem rosto por um instante); ao trocar de expressão, o rosto antigo fica até o novo
 * estar pronto, sem animação. Entra esmaecendo só se ainda não tinha aparecido no encontro (`StageMemory`).
 */
export function Sprite({ c, expr, side, lit }: { c: CharInfo; expr: string; side: 'solo' | 'duelist' | 'player'; lit: boolean }) {
  const seen = useContext(StageMemoryContext);
  // O rosto que ele mostrava na fase anterior (se já apareceu): monta pronto, sem esconder nem entrar de novo.
  const [shown] = useState(() => seen?.get(c.id));
  const enter = !shown;
  const e = expressionFor(c.expressions, expr);
  const { face: f, body: b } = c;
  const bodySrc = `${BASE}characters/${c.id}/body.webp`;
  const faceSrc = `${BASE}characters/${c.id}/${e}.webp`;
  const [bodyReady, setBodyReady] = useState<string | null>(shown ? bodySrc : null);
  const [face, setFace] = useState<string | null>(shown ?? null);
  useEffect(() => {
    let live = true;
    preload(bodySrc).then(() => { if (live) setBodyReady(bodySrc); });
    return () => { live = false; };
  }, [bodySrc]);
  useEffect(() => {
    let live = true;
    preload(faceSrc).then(() => { if (live) setFace(faceSrc); });
    return () => { live = false; };
  }, [faceSrc]);
  const ready = bodyReady === bodySrc && !!face?.startsWith(`${BASE}characters/${c.id}/`);
  // Registra só depois de aparecer: se a fase trocar antes de carregar, a próxima ainda faz a entrada.
  useEffect(() => { if (ready && face) seen?.set(c.id, face); }, [ready, face, seen, c.id]);
  return (
    <div className={`actor ${side}${lit ? ' lit' : ''}${enter ? ' enter' : ''}${ready ? '' : ' loading'}`} style={{ aspectRatio: `${b.w} / ${b.h}`, '--drop': (b.h - (b.bottom ?? b.h)) / b.h } as CSSProperties}>
      <img src={bodySrc} alt="" draggable={false} />
      <img className="face" src={face ?? faceSrc} alt="" draggable={false}
        style={{ left: `${(f.x / b.w) * 100}%`, top: `${(f.y / b.h) * 100}%`, width: `${(f.w / b.w) * 100}%` }} />
    </div>
  );
}

export interface Stage {
  /** Fundo do lugar (`background-image`: a imagem e o degradê de reserva) e o tom do período. */
  bg: string;
  period: 'morning' | 'afternoon' | 'evening';
  /** Quem está em cena com o jogador: a chave do duelista (ou "solomon"). */
  duelist: string;
}

/** O alto da cena: a barra com o lugar e quem está nele, e os corações do laço numa placa embaixo. */
export interface SceneTop {
  title: string; subtitle?: ReactNode; hearts?: number; onBack?: () => void;
  /** A mudança de afinidade de agora (a conversa): um "+20" que salta ao lado dos corações e some, como o LP no duelo. */
  heartsDelta?: number;
}

/** Quem fala a linha: o duelista (ou o vovô, nas falas da loja, que não têm `speaker`) ou o jogador. */
const speakerOf = (l: Line, stage: Stage) => l.speaker ?? stage.duelist;
const NAMES: Record<string, string> = { tristan: 'Tristan', tea: 'Tea', joey: 'Joey', bakura: 'Bakura', yugi: 'Yugi', solomon: 'Vovô' };

/**
 * O palco das falas da campanha (o `DialogueStage` + `DialogueBox` do nativo): o fundo do lugar desfocado com o filtro
 * do período e o circuito; o duelista de corpo inteiro (64% da altura), que vai para a direita quando o jogador entra
 * em cena (quem não fala fica escurecido); a folha de baixo com a placa do nome e o texto; "Pular" acima dela. Sem
 * falas (ou depois da última), a folha mostra `children` (menu, temas, escolha); sem `children`, o fim chama `onDone`.
 */
export function Dialogue({ scene, stage, chars, profile, top, onDone, children }: {
  scene: Scene; stage: Stage; chars: Record<string, CharInfo>; profile: Profile;
  top?: SceneTop; onDone: () => void; children?: ReactNode;
}) {
  const [i, setI] = useState(0);
  const line = scene[i] as Line | undefined;
  const finished = i >= scene.length;

  useEffect(() => { setI(0); }, [scene]);
  useEffect(() => { if (finished && !children) onDone(); }, [finished, children]); // eslint-disable-line react-hooks/exhaustive-deps

  const who = line ? speakerOf(line, stage) : null;
  const playerSpeaking = who === 'player';
  const playerChar = chars[profile.avatar];
  const spoken = scene.slice(0, i + 1);
  const lastDuelist = [...spoken].reverse().find((l) => speakerOf(l, stage) !== 'player');
  const lastPlayer = [...spoken].reverse().find((l) => speakerOf(l, stage) === 'player');
  // Do outro lado do jogador fica quem falou por último (change tier4-finais: a cena de campeão tem vários falantes); nas
  // cenas de um duelista só, é sempre ele.
  const cast = lastDuelist ? speakerOf(lastDuelist, stage) : stage.duelist;
  const duelChar = chars[CHAR_ID[cast] ?? cast];
  const playerOnStage = !!lastPlayer && !finished;
  const name = playerSpeaking ? profile.name : NAMES[cast] ?? duelChar?.name ?? '';
  const color = speakerColor(playerSpeaking ? 'player' : cast);
  // Sem ninguém falando (o menu), todos ficam acesos.
  const lit = (side: 'duelist' | 'player') => !line || (side === 'player') === playerSpeaking;

  return (
    <div className={`story campaign-scene p-${stage.period}`}>
      <div className="scene-bg" style={{ backgroundImage: stage.bg }} />
      <div className="scene-dim" />
      <div className="scene-wash" />
      {top && <TopBar title={top.title} subtitle={top.subtitle} onBack={top.onBack} />}
      {top?.hearts !== undefined && (
        // O "+20" fica fora da placa: a `.hud` corta (clip-path dos cantos) o que sai dela.
        <div className="scene-hearts-wrap">
          <div className="scene-hearts hud"><BondHearts value={top.hearts} size={22} /></div>
          {!!top.heartsDelta && (
            <span className={`heartsdelta num ${top.heartsDelta > 0 ? 'up' : 'down'}`} aria-live="polite">
              {top.heartsDelta > 0 ? `+${top.heartsDelta}` : top.heartsDelta}
            </span>
          )}
        </div>
      )}
      <div className="stage">
        {duelChar && <Sprite key={cast} c={duelChar} expr={lastDuelist?.expression ?? 'neutral'} side={playerOnStage ? 'duelist' : 'solo'} lit={lit('duelist')} />}
        {playerOnStage && playerChar && <Sprite c={playerChar} expr={lastPlayer?.expression ?? 'neutral'} side="player" lit={lit('player')} />}
      </div>
      {line && (
        <>
          {/* Área de toque para avançar: <button> porque o iOS não entrega toques a <div>. */}
          <button type="button" className="tapzone" aria-label="Avançar" data-sound="dialogue" onClick={() => setI(i + 1)} />
          <div className="scene-bottom">
            <button className="hud-btn secondary skip-btn" onClick={() => setI(scene.length)}><GameIcon name="skip" size={18} /> Pular</button>
            <div className="scene-sheet-wrap speaking" style={{ ['--glow' as string]: color }}>
              <div className="scene-sheet hud">
                <div className="nameplate hud" style={{ ['--bar' as string]: color }}>{name}</div>
                <p key={i} className="scene-text">{fillText(line.text, profile.name, profile.address)}</p>
                <span className="more" aria-hidden="true"><GameIcon name="next" size={14} /></span>
              </div>
            </div>
          </div>
        </>
      )}
      {finished && children && (
        <div className="scene-bottom">
          <div className="scene-sheet-wrap" style={{ ['--glow' as string]: speakerColor(cast) }}>
            <div className="scene-sheet hud scene-menu">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
