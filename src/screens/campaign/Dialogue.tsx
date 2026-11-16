import { useEffect, useState, type ReactNode } from 'react';
import type { Line, Scene } from '../../campaign/data/types';
import { fillText } from '../../campaign/text';
import type { Profile } from '../../story/profile';
import { BondHearts } from '../../ui/BondHearts';
import { GameIcon } from '../../ui/icons';
import { TopBar } from '../../ui/TopBar';
import { CHAR_ID, expressionFor, speakerColor, type CharInfo } from './chars';

const BASE = import.meta.env.BASE_URL;

/** Um personagem de corpo inteiro no palco: o corpo e o rosto da expressão por cima. */
export function Sprite({ c, expr, side, lit }: { c: CharInfo; expr: string; side: 'solo' | 'duelist' | 'player'; lit: boolean }) {
  const e = expressionFor(c.expressions, expr);
  const { face: f, body: b } = c;
  return (
    <div className={`actor ${side}${lit ? ' lit' : ''}`} style={{ aspectRatio: `${b.w} / ${b.h}` }}>
      <img src={`${BASE}characters/${c.id}/body.webp`} alt="" draggable={false} />
      <img className="face" src={`${BASE}characters/${c.id}/${e}.webp`} alt="" draggable={false}
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
export interface SceneTop { title: string; subtitle?: ReactNode; hearts?: number; onBack?: () => void }

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
  const duelChar = chars[CHAR_ID[stage.duelist] ?? stage.duelist];
  const playerChar = chars[profile.avatar];
  const spoken = scene.slice(0, i + 1);
  const lastDuelist = [...spoken].reverse().find((l) => speakerOf(l, stage) !== 'player');
  const lastPlayer = [...spoken].reverse().find((l) => speakerOf(l, stage) === 'player');
  const playerOnStage = !!lastPlayer && !finished;
  const name = playerSpeaking ? profile.name : NAMES[stage.duelist] ?? duelChar?.name ?? '';
  const color = speakerColor(playerSpeaking ? 'player' : stage.duelist);
  // Sem ninguém falando (o menu), todos ficam acesos.
  const lit = (side: 'duelist' | 'player') => !line || (side === 'player') === playerSpeaking;

  return (
    <div className={`story campaign-scene p-${stage.period}`}>
      <div className="scene-bg" style={{ backgroundImage: stage.bg }} />
      <div className="scene-dim" />
      <div className="scene-wash" />
      <div className="scene-circuit" />
      {top && <TopBar title={top.title} subtitle={top.subtitle} onBack={top.onBack} />}
      {top?.hearts !== undefined && <div className="scene-hearts hud"><BondHearts value={top.hearts} size={22} /></div>}
      <div className="stage">
        {duelChar && <Sprite c={duelChar} expr={lastDuelist?.expression ?? 'neutral'} side={playerOnStage ? 'duelist' : 'solo'} lit={lit('duelist')} />}
        {playerOnStage && playerChar && <Sprite c={playerChar} expr={lastPlayer?.expression ?? 'neutral'} side="player" lit={lit('player')} />}
      </div>
      {line && (
        <>
          {/* Área de toque para avançar: <button> porque o iOS não entrega toques a <div>. */}
          <button type="button" className="tapzone" aria-label="Avançar" onClick={() => setI(i + 1)} />
          <div className="scene-bottom">
            <button className="hud-btn secondary skip-btn" onClick={() => setI(scene.length)}><GameIcon name="skip" size={18} /> Pular</button>
            <div className="scene-sheet-wrap" style={{ ['--glow' as string]: color }}>
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
          <div className="scene-sheet-wrap" style={{ ['--glow' as string]: speakerColor(stage.duelist) }}>
            <div className="scene-sheet hud scene-menu">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
