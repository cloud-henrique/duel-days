/**
 * O pedaço do D1 que a função usa (sem depender dos tipos do Workers). Nos testes, o mesmo contrato é implementado sobre
 * o `node:sqlite` (`server/testing/sqliteD1.ts`).
 */
export interface D1Result { meta: { changes: number } }
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<D1Result>;
}
export interface D1Like {
  prepare(sql: string): D1Statement;
  /** Executa as instruções numa transação só, na ordem, e devolve o resultado de cada uma. */
  batch(statements: D1Statement[]): Promise<D1Result[]>;
}

/** As ligações e variáveis do projeto do Pages (`wrangler.toml`). */
export interface Env {
  DB: D1Like;
  /** A tag "Application Audience" da aplicação do Access. */
  ACCESS_AUD: string;
  /** O domínio da equipe do Zero Trust (`<equipe>.cloudflareaccess.com`). */
  ACCESS_TEAM: string;
  /** Só no `wrangler pages dev` (`--binding DEV_EMAIL=...`): o e-mail aceito sem JWT, e só vindo de `localhost`. */
  DEV_EMAIL?: string;
}
