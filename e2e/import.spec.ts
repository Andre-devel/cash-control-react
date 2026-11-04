import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from './support/test'
import { SEED, isMobile, login, projectTag } from './support/session'
import type { Page, TestInfo } from '@playwright/test'

const FIXTURE = fileURLToPath(new URL('./fixtures/extrato-inter.csv', import.meta.url))
const HEADER = 'Data Lançamento;Histórico;Descrição;Valor;Saldo'

/**
 * O extrato sintético com a descrição de cada lançamento marcada pelo projeto. Desktop e mobile
 * importam na mesma conta, e a chave de deduplicação inclui a descrição: sem a marca, o segundo
 * projeto veria as 20 linhas como já importadas.
 */
function statementFor(testInfo: TestInfo): Buffer {
  const lines = readFileSync(FIXTURE, 'utf-8').split('\n')
  const header = lines.indexOf(HEADER)
  const tagged = lines.map((line, index) => {
    if (index <= header || line.trim() === '') return line
    const columns = line.split(';')
    columns[2] = `${columns[2]} ${projectTag(testInfo)}`
    return columns.join(';')
  })
  return Buffer.from(tagged.join('\n'), 'utf-8')
}

async function openImportDialog(page: Page, testInfo: TestInfo): Promise<void> {
  if (isMobile(testInfo)) {
    await page.getByRole('button', { name: 'Novo lançamento' }).click()
    await page
      .getByRole('dialog', { name: 'Novo lançamento' })
      .getByRole('button', { name: /Importar extrato/ })
      .click()
  } else {
    await page.goto('/transactions')
    await page.getByRole('button', { name: 'Importar extrato' }).click()
  }
}

test.describe('importação de extrato', () => {
  test('importa as 20 linhas de um CSV do Inter', async ({ page }, testInfo) => {
    await login(page)
    await openImportDialog(page, testInfo)

    const dialog = page.getByRole('dialog', { name: 'Importar extrato' })
    await dialog.getByLabel('Conta de destino').selectOption({ label: SEED.account })
    await expect(dialog.getByLabel('Formato do extrato')).toHaveValue('INTER_CSV')
    await dialog.getByLabel('Arquivo').setInputFiles({
      name: 'extrato-inter.csv',
      mimeType: 'text/csv',
      buffer: statementFor(testInfo),
    })
    await dialog.getByRole('button', { name: 'Analisar arquivo' }).click()

    await expect(dialog.getByText(/Passo 2 de 2/)).toBeVisible()
    await expect(dialog.getByText('20 de 20 selecionadas')).toBeVisible()
    await expect(dialog.getByTestId(/^import-row-/)).toHaveCount(20)

    await dialog.getByRole('button', { name: 'Importar 20 transações' }).click()

    await expect(page.getByText(/^20 transações importadas/)).toBeVisible()
    await expect(dialog).toBeHidden()
  })
})
