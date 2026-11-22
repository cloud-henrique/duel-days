// O contrato do D1 (`server/d1.ts`) sobre o `node:sqlite`, para os testes rodarem o SQL de verdade.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { D1Like, D1Result, D1Statement } from '../d1';

// `require` para o Vite não tentar resolver o módulo (o `node:sqlite` é recente e fica fora da lista de embutidos dele).
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

export function sqliteD1(): D1Like & { raw: InstanceType<typeof DatabaseSync> } {
  const raw = new DatabaseSync(':memory:');
  raw.exec(readFileSync(new URL('../../migrations/0001_saves.sql', import.meta.url), 'utf8'));
  const stmt = (sql: string, values: unknown[] = []): D1Statement & { exec(): D1Result } => {
    const args = () => values as (string | number | null)[];
    const exec = (): D1Result => ({ meta: { changes: Number(raw.prepare(sql).run(...args()).changes) } });
    return {
      bind: (...v: unknown[]) => stmt(sql, v),
      first: async <T,>() => (raw.prepare(sql).get(...args()) as T | undefined) ?? null,
      all: async <T,>() => ({ results: raw.prepare(sql).all(...args()) as T[] }),
      run: async () => exec(),
      exec,
    };
  };
  return {
    raw,
    prepare: (sql) => stmt(sql),
    batch: async (list) => {
      raw.exec('BEGIN');
      try {
        const out = list.map((s) => (s as ReturnType<typeof stmt>).exec());
        raw.exec('COMMIT');
        return out;
      } catch (e) { raw.exec('ROLLBACK'); throw e; }
    },
  };
}
