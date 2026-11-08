import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/rules/**/*.spec.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});
