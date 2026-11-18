// Modo da CPU nas ferramentas: `--cpu=barata` (só a política barata, rápido; padrão) ou `--cpu=busca[:N]` (a busca com N
// simulações por decisão, sem teto de tempo: o resultado não depende da máquina). Tira a opção do argv.
import type { DriverOptions } from '../src/engine/driver';

export function cpuMode(defaultMode = 'barata'): { label: string; budget: NonNullable<DriverOptions['budget']> } {
  const i = process.argv.findIndex((a) => a.startsWith('--cpu='));
  const raw = i >= 0 ? process.argv.splice(i, 1)[0].slice(6) : defaultMode;
  const [mode, n] = raw.split(':');
  if (mode === 'barata') return { label: 'CPU: política barata', budget: { maxSims: 0, maxMs: Infinity } };
  if (mode === 'busca') {
    const sims = Number(n ?? 24);
    return { label: `CPU: busca com ${sims} simulações`, budget: { maxSims: sims, maxMs: Infinity } };
  }
  throw new Error(`--cpu=${raw}: use barata ou busca[:N]`);
}
