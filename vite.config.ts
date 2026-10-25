import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 43201,
    strictPort: true,
    allowedHosts: ['.cursorvm.com'],
  },
  preview: {
    host: '0.0.0.0',
    port: 43201,
    strictPort: true,
    allowedHosts: ['.cursorvm.com'],
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
  },
})
