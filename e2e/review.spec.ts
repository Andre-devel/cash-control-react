import { expect, test } from './support/test'
import { login, navigateTo, projectTag } from './support/session'

test.describe('revisão dos lançamentos do banco', () => {
  test('confirma a pendência inserida pelo seed', async ({ page }, testInfo) => {
    // Gravada direto em bank_pending_transactions por e2e/fixtures/seed.sql, uma por projeto.
    const pending = `Padaria Pendente ${projectTag(testInfo)}`

    await login(page)
    await navigateTo(page, testInfo, 'Revisar')
    await expect(page).toHaveURL(/\/revisar/)
    await expect(page.getByRole('heading', { name: 'Revisar lançamentos' })).toBeVisible()

    // A fila mostra um lançamento por vez; pula até o deste projeto.
    const card = page.getByRole('region', { name: 'Lançamento a revisar' })
    const name = card.getByLabel('Nome')
    await expect(name).toBeVisible()
    for (let i = 0; i < 5 && (await name.inputValue()) !== pending; i++) {
      await card.getByRole('button', { name: 'Pular' }).click()
    }
    await expect(name).toHaveValue(pending)

    await card.getByRole('button', { name: 'Confirmar e próximo' }).click()

    await expect(page.getByText(`Gravado: ${pending}`)).toBeVisible()
    // Saiu da fila: o cartão passa para o próximo ou a fila fica vazia ("Tudo revisado").
    await expect.poll(() => name.inputValue({ timeout: 500 }).catch(() => null)).not.toBe(pending)
  })
})
