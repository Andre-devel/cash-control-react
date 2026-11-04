import { expect, test } from './support/test'
import { login, openNewTransaction, projectTag } from './support/session'

test.describe('transações', () => {
  test('cria uma despesa e a vê no Início', async ({ page }, testInfo) => {
    const description = `Mercado E2E ${projectTag(testInfo)} ${Date.now()}`

    await login(page)
    await openNewTransaction(page, testInfo)

    const dialog = page.getByRole('dialog', { name: 'Nova transação' })
    await dialog.getByRole('radio', { name: 'Despesa' }).check({ force: true })
    await dialog.getByLabel('Valor').fill('87,35')
    await dialog.getByLabel('Descrição').fill(description)
    // A única conta do seed já vem escolhida; a data de competência é hoje.
    await expect(dialog.getByLabel('Conta')).toHaveValue(/.+/)
    await dialog.getByRole('button', { name: /Criar transação/ }).click()

    await expect(page.getByText('Transação criada com sucesso.')).toBeVisible()
    await expect(dialog).toBeHidden()

    const recent = page.getByRole('region', { name: 'Transações recentes' })
    await expect(recent.getByText(description)).toBeVisible()
  })
})
