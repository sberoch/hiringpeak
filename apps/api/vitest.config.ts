import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: './',
    include: ['src/**/*.{test,spec}.ts'],
    // Service specs run on an in-memory Postgres (PGlite), slower under load.
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
