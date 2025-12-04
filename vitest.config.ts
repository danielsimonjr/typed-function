import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'build', 'lib'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/wasm/assembly/**/*.ts'],
    },
    testTimeout: 10000,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
});
