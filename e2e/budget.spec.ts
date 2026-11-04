import { expect, test } from './support/test'
import { isMobile, login, navigateTo } from './support/session'

test.describe('orçamentos', () => {
  test('cria um orçamento e vê a barra da categoria', async ({ page }, testInfo) => {
    // Uma categoria por projeto: o teto é único por categoria e os dois projetos dividem o banco.
    // Categorias que nem o extrato importado nem os outros specs usam, para o gasto ser zero.
    const category = isMobile(testInfo) ? 'Impostos e Taxas' : 'Viagens'

    await login(page)
    await navigateTo(page, testInfo, 'Orçamentos')
    await expect(page.getByRole('heading', { name: 'Orçamentos', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'Novo orçamento' }).click()
    const dialog = page.getByRole('dialog', { name: 'Novo orçamento' })
    await dialog.getByLabel('Categoria').selectOption({ label: `${category} (tudo)` })
    await dialog.getByLabel('Teto do mês').fill('500,00')
    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('Orçamento salvo.')).toBeVisible()
    await expect(dialog).toBeHidden()

    const row = page
      .getByRole('region', { name: 'Categorias' })
      .getByRole('button', { name: new RegExp(category) })
    await expect(row).toBeVisible()
    await expect(row).toContainText('0%')
    await expect(row).toContainText(/R\$\s?0,00 de R\$\s?500,00/)
    await expect(row).toContainText(/Falta R\$\s?500,00/)
    // A barra é decorativa (aria-hidden); o tom sai do percentual gasto.
    await expect(row.locator('[data-tone]')).toBeVisible()
  })
})
