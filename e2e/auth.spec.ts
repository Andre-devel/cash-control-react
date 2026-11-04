import { expect, test } from './support/test'
import { E2E_USER, login, logout } from './support/session'

test.describe('autenticação', () => {
  test('entra com e-mail e senha e sai', async ({ page }, testInfo) => {
    await login(page)
    await expect(page.getByRole('main')).toBeVisible()

    await logout(page, testInfo)
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()

    // Sessão encerrada de verdade: rota protegida volta para o login.
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('recusa senha errada', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(E2E_USER.email)
    await page.getByLabel('Senha', { exact: true }).fill('senha-errada-123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('Credenciais inválidas.')).toBeVisible()
  })
})
