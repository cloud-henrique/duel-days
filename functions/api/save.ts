// Pages Function de `/api/save` (change save-na-nuvem): o save do jogador na nuvem. A lógica fica em `server/`.
import type { Env } from '../../server/d1';
import { handleSave } from '../../server/handler';

export const onRequest = (ctx: { request: Request; env: Env }) => handleSave(ctx.request, ctx.env);
