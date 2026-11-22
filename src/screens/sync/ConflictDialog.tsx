import { useState } from 'react';
import type { RemoteSave } from '../../../server/protocol';
import type { LocalSave } from '../../story/progress';
import { formatSavedAt, remoteProgress, summarize, type SideSummary } from '../../story/sync';
import { thisDevice } from '../../story/device';
import { Dp } from '../../ui/Dp';
import { GameIcon } from '../../ui/icons';
import { Modal } from '../../ui/Modal';
import './sync.css';

function Side({ title, s }: { title: string; s: SideSummary }) {
  return (
    <div className="syncside cut">
      <span className="field-label game-title">{title}</span>
      <b className="syncside-when">{s.when}</b>
      {!s.erased && (
        <ul>
          {s.dp !== null && <li><Dp value={s.dp} /></li>}
          <li><GameIcon name="trophy" size={14} /> <span className="num">{s.wins}</span> {s.wins === 1 ? 'vitória' : 'vitórias'}</li>
          {s.cards !== null && <li><GameIcon name="collection" size={14} /> <span className="num">{s.cards}</span> cartas</li>}
        </ul>
      )}
      <small>Salvo no {s.device}, {formatSavedAt(s.savedAt)}</small>
    </div>
  );
}

/**
 * A escolha quando este aparelho e a nuvem avançaram separados: os dois lados lado a lado e um botão para cada. Nada é
 * sobrescrito antes da escolha, e o lado que perde fica guardado na nuvem entre as versões anteriores.
 */
export function ConflictDialog({ local, remote, onChoose, onLater }: {
  local: LocalSave; remote: RemoteSave; onChoose: (c: 'cloud' | 'local') => Promise<void> | void; onLater: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const mine = summarize(local.progress, thisDevice(), local.updatedAt);
  const cloud = summarize(remoteProgress(remote), remote.device, remote.updatedAt);
  const choose = async (c: 'cloud' | 'local') => { setBusy(true); try { await onChoose(c); } finally { setBusy(false); } };
  return (
    <Modal title="Qual save continua?" onClose={onLater} className="conflictdialog">
      <p>Este aparelho e a nuvem avançaram separados. Escolha qual save fica; o outro continua guardado na nuvem.</p>
      <div className="syncsides">
        <Side title="Este aparelho" s={mine} />
        <Side title="Nuvem" s={cloud} />
      </div>
      <div className="acts">
        <button className="hud-btn" disabled={busy} onClick={() => choose('local')}>Ficar com este aparelho</button>
        <button className="hud-btn primary" disabled={busy} onClick={() => choose('cloud')}>Ficar com a nuvem</button>
      </div>
      <button className="hud-btn secondary" disabled={busy} onClick={onLater}>Decidir depois</button>
    </Modal>
  );
}

/** O aviso depois de trazer o progresso de outro aparelho com o app aberto. */
export function PulledNotice({ device, onClose }: { device: string | null; onClose: () => void }) {
  return (
    <Modal title="Progresso atualizado" onClose={onClose}>
      <p>O seu progresso foi atualizado de outro aparelho{device ? ` (${device})` : ''}.</p>
      <button className="hud-btn primary" onClick={onClose}><GameIcon name="check" /> OK</button>
    </Modal>
  );
}
