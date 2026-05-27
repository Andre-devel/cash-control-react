import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: [
        'src/test/**',
        'src/**/__tests__/**',
        '**/*.d.ts',
        'src/vite-env.d.ts',
        'src/**/types/index.ts',
        'src/**/types/*.ts',
        'src/App.tsx',
      ],
      thresholds: {
        'src/features/auth/**': {
          lines: 80,
          statements: 80,
          branches: 80,
          functions: 80,
        },
        'src/features/roles/**': {
          lines: 80,
          statements: 80,
          branches: 80,
          functions: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
