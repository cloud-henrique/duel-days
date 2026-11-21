import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Separado do vite.config.ts para os testes não carregarem o plugin do PWA nem o middleware de logs.
// Ambiente padrão: node. Testes de componente declaram `// @vitest-environment happy-dom` no topo.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    // Os testes da CPU simulam duelos (1–3 s cada sozinhos); com a suíte em paralelo e a máquina ocupada passavam dos 5 s.
    testTimeout: 20_000,
  },
});
