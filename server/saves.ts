import type { D1Like } from './d1';
import { HISTORY_KEEP, type RemoteSave } from './protocol';

interface Row { rev: number; version: number; data: string | null; device: string; updated_at: number }

const toRemote = (r: Row): RemoteSave => ({
  rev: r.rev, version: r.version, data: r.data === null ? null : JSON.parse(r.data), device: r.device, updatedAt: r.updated_at,
});

export async function readSave(db: D1Like, email: string): Promise<RemoteSave | null> {
  const r = await db.prepare('SELECT rev, version, data, device, updated_at FROM saves WHERE email = ?').bind(email).first<Row>();
  return r ? toRemote(r) : null;
}

/** Copia a linha atual (se ainda estiver em `baseRev`) para o histórico. */
const archiveCurrent = (db: D1Like, email: string, baseRev: number, reason: string) =>
  db.prepare(`INSERT INTO save_history (email, rev, version, data, device, updated_at, reason)
    SELECT email, rev, version, data, device, updated_at, ? FROM saves WHERE email = ? AND rev = ?`).bind(reason, email, baseRev);

const prune = (db: D1Like, email: string) =>
  db.prepare(`DELETE FROM save_history WHERE email = ? AND id NOT IN
    (SELECT id FROM save_history WHERE email = ? ORDER BY id DESC LIMIT ?)`).bind(email, email, HISTORY_KEEP);

export type WriteResult = { ok: true; rev: number } | { ok: false; current: RemoteSave | null };

/**
 * Grava o save (ou a lápide, com `data` nulo) só se a nuvem ainda estiver em `baseRev` (0 = sem linha). A linha
 * anterior vai para o histórico na mesma transação. Se a nuvem andou, nada muda e volta o que ela tem.
 */
export async function writeSave(db: D1Like, email: string, baseRev: number, version: number, data: unknown | null,
  device: string, now: number): Promise<WriteResult> {
  const json = data === null ? null : JSON.stringify(data);
  const write = baseRev === 0
    ? db.prepare(`INSERT INTO saves (email, rev, version, data, device, updated_at) VALUES (?, 1, ?, ?, ?, ?)
        ON CONFLICT (email) DO NOTHING`).bind(email, version, json, device, now)
    : db.prepare(`UPDATE saves SET rev = rev + 1, version = ?, data = ?, device = ?, updated_at = ?
        WHERE email = ? AND rev = ?`).bind(version, json, device, now, email, baseRev);
  const [, written] = await db.batch([archiveCurrent(db, email, baseRev, data === null ? 'erased' : 'replaced'), write, prune(db, email)]);
  if (written.meta.changes === 1) return { ok: true, rev: baseRev + 1 };
  return { ok: false, current: await readSave(db, email) };
}

/** Guarda entre as versões anteriores um save que o jogador descartou num conflito (sem mexer no save atual). */
export async function keepDiscarded(db: D1Like, email: string, version: number, data: unknown | null, device: string, now: number) {
  const rev = (await readSave(db, email))?.rev ?? 0;
  await db.batch([
    db.prepare(`INSERT INTO save_history (email, rev, version, data, device, updated_at, reason) VALUES (?, ?, ?, ?, ?, ?, 'discarded')`)
      .bind(email, rev, version, data === null ? null : JSON.stringify(data), device, now),
    prune(db, email),
  ]);
}

export async function historyOf(db: D1Like, email: string) {
  return (await db.prepare('SELECT rev, version, data, device, updated_at, reason FROM save_history WHERE email = ? ORDER BY id DESC')
    .bind(email).all<Row & { reason: string }>()).results;
}
