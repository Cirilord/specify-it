import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    coverage: {
      exclude: ['src/**/*.test.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'html'],
    },
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

export default config;
