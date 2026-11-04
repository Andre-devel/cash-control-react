import { defineConfig, devices } from '@playwright/test'

const externalBaseUrl = process.env.E2E_BASE_URL

/**
 * E2E dos fluxos críticos. Os specs rodam contra o front em `E2E_BASE_URL`; sem ela, sobe (ou
 * reaproveita) o `pnpm dev` em :5173, que faz proxy de `/api` para a API de
 * `e2e/docker-compose.yml`. Ver `e2e/README.md`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: externalBaseUrl ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  // Base relativa: as chamadas passam pelo proxy do Vite e o cookie de refresh fica na mesma
  // origem. Variável de processo vence o `.env.local` de quem roda.
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'pnpm dev --port 5173 --strictPort',
        url: 'http://localhost:5173',
        env: { VITE_API_BASE_URL: '/api/v1' },
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
})
