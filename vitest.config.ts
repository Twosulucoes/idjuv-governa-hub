import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Config separada do vite.config.ts para não carregar o plugin de PWA nos testes.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tenants': path.resolve(__dirname, './tenants'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs', 'supabase/functions/**/*.test.ts'],
  },
});
