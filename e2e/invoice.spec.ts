import { expect, test } from './support/test'
import {
  SEED,
  isMobile,
  login,
  navigateTo,
  openNewTransaction,
  projectTag,
} from './support/session'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/**
 * Compra no dia 15 de alguns meses atrás. O cartão do seed fecha no dia 1 e vence no 10 do mesmo
 * mês, então a compra cai na fatura que vence no mês seguinte ao dela: já fechada e vencida,
 * portanto pagável (fatura ABERTA a API recusa). Cada projeto usa um mês, para cada um pagar a
 * sua fatura no mesmo banco.
 */
function purchaseFor(monthsAgo: number) {
  const now = new Date()
  const purchase = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 15)
  const due = new Date(purchase.getFullYear(), purchase.getMonth() + 1, 10)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    competenceDate: `${purchase.getFullYear()}-${pad(purchase.getMonth() + 1)}-15`,
    invoiceLabel: `${MONTHS[due.getMonth()]} ${due.getFullYear()}`,
  }
}

test.describe('fatura do cartão', () => {
  test('lança uma compra no cartão e paga a fatura', async ({ page }, testInfo) => {
    const { competenceDate, invoiceLabel } = purchaseFor(isMobile(testInfo) ? 4 : 3)
    const description = `Loja E2E ${projectTag(testInfo)}`

    await login(page)

    await openNewTransaction(page, testInfo)
    const form = page.getByRole('dialog', { name: 'Nova transação' })
    await form.getByLabel('Valor').fill('250,00')
    await form.getByLabel('Descrição').fill(description)
    await form.getByLabel('Forma de pagamento').selectOption('CREDIT_CARD')
    await form.getByLabel('Cartão de crédito').selectOption({ label: `${SEED.card} (MASTERCARD)` })
    await form.getByLabel('Data de competência').fill(competenceDate)
    await form.getByRole('button', { name: /Criar transação/ }).click()
    await expect(page.getByText('Transação criada com sucesso.')).toBeVisible()
    await expect(form).toBeHidden()

    await navigateTo(page, testInfo, 'Faturas')
    await expect(page).toHaveURL(/\/invoices/)
    await page
      .getByRole('link', { name: new RegExp(`^(Abrir f|F)atura de ${invoiceLabel}$`) })
      .click()
    await expect(page.getByRole('heading', { name: `Fatura ${invoiceLabel}` })).toBeVisible()

    await page.getByRole('button', { name: 'Pagar fatura' }).click()
    const payment = page.getByRole('dialog', { name: `Pagar fatura · ${SEED.card}` })
    await expect(payment.getByLabel('Valor a pagar')).toHaveValue(/250/)
    await payment.getByLabel('Conta de origem').selectOption({ label: SEED.account })
    await payment.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(page.getByText('Pagamento da fatura registrado com sucesso.')).toBeVisible()
    await expect(payment).toBeHidden()
    await expect(page.getByRole('main').getByText('Paga', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pagar fatura' })).toBeHidden()
  })
})
