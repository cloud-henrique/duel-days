import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Separado do vite.config.ts para os testes não carregarem o plugin do PWA nem o middleware de logs.
// Ambiente padrão: node. Testes de componente declaram `// @vitest-environment happy-dom` no topo.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
