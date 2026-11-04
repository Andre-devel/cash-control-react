import type { Page, TestInfo } from '@playwright/test'
import { expect } from './test'

/** Usuário criado por `e2e/fixtures/seed.sql`. Senha só do ambiente E2E descartável. */
export const E2E_USER = {
  email: 'e2e@cashcontrol.test',
  password: 'E2e-Senha#2026',
} as const

/** Nomes da conta e do cartão do seed. */
export const SEED = {
  account: 'Conta E2E',
  card: 'Cartão E2E',
} as const

export function isMobile(testInfo: TestInfo): boolean {
  return testInfo.project.name === 'mobile'
}

/** Sufixo para os dados que cada projeto cria, já que desktop e mobile dividem o mesmo banco. */
export function projectTag(testInfo: TestInfo): string {
  return isMobile(testInfo) ? 'Mobile' : 'Desktop'
}

export async function login(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(E2E_USER.email)
  await page.getByLabel('Senha', { exact: true }).fill(E2E_USER.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

/** No desktop o "Sair" fica na barra do topo; no celular, dentro de "Mais". */
export async function logout(page: Page, testInfo: TestInfo): Promise<void> {
  if (isMobile(testInfo)) {
    await page
      .getByRole('navigation', { name: 'Navegação principal' })
      .getByRole('button', { name: /^Mais/ })
      .click()
    await page.getByRole('dialog', { name: 'Mais' }).getByRole('button', { name: 'Sair' }).click()
  } else {
    await page.getByRole('button', { name: 'Sair' }).click()
  }
  await expect(page).toHaveURL(/\/login/)
}

/** Abre "Nova transação": botão do Início no desktop, FAB "Novo lançamento" no celular. */
export async function openNewTransaction(page: Page, testInfo: TestInfo): Promise<void> {
  if (isMobile(testInfo)) {
    await page.getByRole('button', { name: 'Novo lançamento' }).click()
    await page
      .getByRole('dialog', { name: 'Novo lançamento' })
      .getByRole('button', { name: /Nova transação/ })
      .click()
  } else {
    await page.getByRole('main').getByRole('button', { name: 'Nova transação' }).click()
  }
  await expect(page.getByRole('dialog', { name: 'Nova transação' })).toBeVisible()
}

/** Leva para uma tela pela navegação do layout (barra lateral ou "Mais" do celular). */
export async function navigateTo(page: Page, testInfo: TestInfo, label: string): Promise<void> {
  if (isMobile(testInfo)) {
    const bottomNav = page.getByRole('navigation', { name: 'Navegação principal' })
    const shortcut = bottomNav.getByRole('link', { name: label, exact: true })
    if (await shortcut.count()) {
      await shortcut.click()
      return
    }
    await bottomNav.getByRole('button', { name: /^Mais/ }).click()
    await page
      .getByRole('dialog', { name: 'Mais' })
      .getByRole('link', { name: new RegExp(`^${label}`) })
      .click()
  } else {
    await page
      .locator('.sidebar')
      .getByRole('link', { name: new RegExp(`^${label}`) })
      .click()
  }
}
