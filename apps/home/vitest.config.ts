import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@deriv/core': path.resolve(__dirname, '../accumulators/packages/core/src'),
    },
  },
});
