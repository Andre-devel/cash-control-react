import { test as base } from '@playwright/test'

export { expect } from '@playwright/test'

/**
 * `test` dos specs. No `pnpm dev` o botão flutuante do TanStack Query Devtools fica por cima de
 * controles do topo (o "Sair", por exemplo) e intercepta o clique; no build de produção ele nem
 * existe. Some com ele antes de qualquer script da página rodar.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style')
        style.textContent = '.tsqd-parent-container { display: none !important; }'
        document.head.appendChild(style)
      })
    })
    await use(page)
  },
})
