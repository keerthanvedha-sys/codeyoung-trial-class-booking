import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false, // Run test files sequentially to avoid SQLite file locking & state conflicts
    testTimeout: 10000,
  },
});
