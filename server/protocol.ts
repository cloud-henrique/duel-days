/**
 * O contrato de `/api/save` (change save-na-nuvem), compartilhado pela função e pelo app.
 *
 * GET    → 200 RemoteSave | 404 (a conta nunca gravou)
 * PUT    { baseRev, version, data, device } → 200 { rev } | 409 RemoteSave (a nuvem andou)
 * DELETE { baseRev, device }                → 200 { rev } (vira lápide) | 409 RemoteSave
 * POST   { version, data, device }          → 204 (guarda um save descartado num conflito entre as versões anteriores)
 *
 * Sem identidade do Access: 401. Corpo acima de `MAX_SAVE_BYTES`: 413. Corpo inválido: 400.
 */
export interface RemoteSave {
  /** Cresce de 1 em 1 a cada gravação aceita. */
  rev: number;
  /** A `CAMPAIGN_VERSION` do app que gravou. */
  version: number;
  /** O save (o `Progress` do app), ou nulo: a lápide de "Apagar progresso". */
  data: unknown | null;
  /** O rótulo do aparelho que gravou ("iPhone", "Mac"...). */
  device: string;
  /** Hora do servidor, em ms. */
  updatedAt: number;
}

export interface PutBody { baseRev: number; version: number; data: unknown; device: string }
export interface DeleteBody { baseRev: number; device: string }
export interface DiscardBody { version: number; data: unknown | null; device: string }

export const MAX_SAVE_BYTES = 1024 * 1024;
/** Quantas versões anteriores a nuvem guarda por jogador. */
export const HISTORY_KEEP = 10;
export const MAX_DEVICE_CHARS = 40;
