import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  resetTransactionsStore,
  resetImportStore,
  getLastImportCommit,
  MOCK_IMPORT_PREVIEW,
} from '@/test/handlers/transactions.handlers'
import { resetAccountsStore } from '@/test/handlers/accounts.handlers'
import type * as StatementImportApi from '@/features/transactions/api/statement-import.api'
import { previewStatementImport } from '@/features/transactions/api/statement-import.api'
import type { ImportPreviewResponse, ImportPreviewRow } from '@/features/transactions/types'
import { ImportStatementDialog } from '../import-statement-dialog'

// O XHR do jsdom trava num POST multipart com arquivo, então a prévia não pode passar
// pelo MSW como as demais chamadas. O formato do upload é coberto em
// api/__tests__/statement-import.api.test.ts; aqui o que importa é o comportamento da
// tela. A confirmação continua indo pelo MSW normalmente — ela é JSON.
vi.mock('@/features/transactions/api/statement-import.api', async (importOriginal) => {
  const actual = await importOriginal<typeof StatementImportApi>()
  return {
    ...actual,
    previewStatementImport: vi.fn(async () => MOCK_IMPORT_PREVIEW),
  }
})

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {},
}))

beforeEach(() => {
  resetTransactionsStore()
  resetAccountsStore()
  resetImportStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

function renderDialog(open = true) {
  const onClose = vi.fn()
  renderWithProviders(<ImportStatementDialog open={open} onClose={onClose} />)
  return { onClose }
}

const INVOICE_SEP = {
  id: 'invoice-9',
  label: 'Inter - PF · 2026-09',
  totalAmount: '1754.74',
  dueDate: '2026-10-10',
}

/** Prévia com uma linha só, para os testes de troca de tipo. */
function previewWithSingleRow(patch: Partial<ImportPreviewRow>): ImportPreviewResponse {
  const base = previewWithRepeatedMerchant()
  return {
    ...base,
    totalRows: 1,
    importableCount: 1,
    rows: [{ ...base.rows[0], externalRef: 'ref-unica', ...patch }],
  }
}

async function analyzeFile(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => screen.getByRole('option', { name: 'Nubank' }))
  await user.selectOptions(screen.getByRole('combobox', { name: /conta de destino/i }), 'account-1')
  await user.upload(screen.getByLabelText(/arquivo/i), csvFile())
  await user.click(screen.getByRole('button', { name: /analisar arquivo/i }))
}

/** Prévia com o mesmo estabelecimento repetido, que é o caso do "aplicar às iguais". */
function previewWithRepeatedMerchant(): ImportPreviewResponse {
  const row = (
    lineNumber: number,
    externalRef: string,
    description: string,
    merchantKey: string,
  ): ImportPreviewRow => ({
    lineNumber,
    externalRef,
    date: '2026-07-19',
    description,
    rawHistory: 'Compra no débito',
    amount: '65.30',
    type: 'EXPENSE',
    paymentMethod: 'DEBIT_CARD',
    suggestedDescription: null,
    merchantKey,
    suggestedCategoryId: null,
    suggestedCategoryName: null,
    suggestedSubcategoryId: null,
    suggestedSubcategoryName: null,
    suggestionSource: 'NONE',
    duplicate: false,
    unknownHistory: false,
    outgoing: true,
    transferAccountId: null,
    transferAccountName: null,
    invoiceId: null,
    invoiceLabel: null,
    invoiceAmountMismatch: false,
    invoiceOptions: [],
    investment: false,
    invoicePaymentUnmatched: false,
    possibleDuplicate: false,
  })

  return {
    ...MOCK_IMPORT_PREVIEW,
    totalRows: 3,
    importableCount: 3,
    duplicateCount: 0,
    warningCount: 0,
    errors: [],
    rows: [
      row(10, 'ref-sorvete-1', 'Sorveteka Penapolis Bra', 'sorveteka penapolis'),
      row(11, 'ref-sorvete-2', 'Sorveteka Penapolis Bra', 'sorveteka penapolis'),
      row(12, 'ref-outra', 'Drogal Penapolis Bra', 'drogal penapolis'),
    ],
  }
}

function csvFile() {
  return new File(['Data Lançamento;Histórico;Descrição;Valor;Saldo\n'], 'extrato-inter.csv', {
    type: 'text/csv',
  })
}

/** Passo 1 completo: conta escolhida, arquivo enviado, prévia carregada. */
async function reachPreview(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => screen.getByRole('option', { name: 'Nubank' }))
  await user.selectOptions(screen.getByRole('combobox', { name: /conta de destino/i }), 'account-1')
  await user.upload(screen.getByLabelText(/arquivo/i), csvFile())
  await user.click(screen.getByRole('button', { name: /analisar arquivo/i }))
  await waitFor(() => expect(screen.getByText('Pix Marketplace')).toBeInTheDocument())
}

describe('ImportStatementDialog', () => {
  it('does not render when open is false', () => {
    renderDialog(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('blocks the analysis until an account and a file are chosen', async () => {
    const user = userEvent.setup()
    renderDialog()

    const analyze = screen.getByRole('button', { name: /analisar arquivo/i })
    expect(analyze).toBeDisabled()

    await waitFor(() => screen.getByRole('option', { name: 'Nubank' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: /conta de destino/i }),
      'account-1',
    )
    expect(analyze).toBeDisabled()

    await user.upload(screen.getByLabelText(/arquivo/i), csvFile())
    expect(analyze).toBeEnabled()
  })

  it('offers only non-archived accounts as destination', async () => {
    renderDialog()
    await waitFor(() => screen.getByRole('option', { name: 'Nubank' }))

    expect(screen.queryByRole('option', { name: 'Old Account' })).toBeNull()
  })

  it('shows every parsed row with its classification', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByText('Pix Marketplace')).toBeInTheDocument()
    expect(screen.getByText('Dias E Damasceno Ltda')).toBeInTheDocument()
    expect(screen.getByText('Tarifa Cesta B')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /categoria da linha 7/i })).toHaveTextContent(
      'Food',
    )
    expect(screen.getByText(/323236715/)).toBeInTheDocument()
  })

  it('reports rows that could not be read', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByRole('alert')).toHaveTextContent(/linha 24/i)
  })

  it('leaves already-imported rows unchecked and flags rows to review', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const duplicateRow = screen.getByTestId('import-row-8')
    expect(within(duplicateRow).getByRole('checkbox')).not.toBeChecked()
    expect(within(duplicateRow).getByText(/já importada/i)).toBeInTheDocument()

    const newRow = screen.getByTestId('import-row-7')
    expect(within(newRow).getByRole('checkbox')).toBeChecked()

    const unknownRow = screen.getByTestId('import-row-9')
    expect(within(unknownRow).getByRole('checkbox')).toBeChecked()
    expect(within(unknownRow).getByText(/revisar/i)).toBeInTheDocument()
  })

  it('counts only the checked rows on the confirm button', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByRole('button', { name: /importar 2 transações/i })).toBeInTheDocument()

    await user.click(within(screen.getByTestId('import-row-7')).getByRole('checkbox'))
    expect(screen.getByRole('button', { name: /importar 1 transações/i })).toBeInTheDocument()
  })

  it('sends only the checked rows, keeping externalRef and the suggested category', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()
    await reachPreview(user)

    // Tira a linha de revisão: só a primeira deve viajar.
    await user.click(within(screen.getByTestId('import-row-9')).getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /importar 1 transações/i }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())

    const commit = getLastImportCommit()
    expect(commit).not.toBeNull()
    expect(commit!.accountId).toBe('account-1')
    expect(commit!.format).toBe('INTER_CSV')
    expect(commit!.rows).toHaveLength(1)
    expect(commit!.rows[0]).toMatchObject({
      externalRef: 'ref-nova',
      date: '2026-08-04',
      description: 'Pix Marketplace',
      amount: '144.06',
      type: 'EXPENSE',
      paymentMethod: 'PIX',
      categoryId: 'cat-1',
    })
  })

  it('never sends a row the user left unchecked, even a duplicate', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await user.click(screen.getByRole('button', { name: /importar 2 transações/i }))

    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    expect(getLastImportCommit()!.rows.map((row) => row.externalRef)).toEqual([
      'ref-nova',
      'ref-revisar',
    ])
  })

  it('select-all toggles every importable row without touching duplicates', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const selectAll = screen.getByRole('checkbox', { name: /selecionar todos/i })
    expect(selectAll).toBeChecked()

    await user.click(selectAll)
    expect(screen.getByRole('button', { name: /importar 0 transações/i })).toBeDisabled()

    await user.click(selectAll)
    expect(screen.getByRole('button', { name: /importar 2 transações/i })).toBeEnabled()
    expect(within(screen.getByTestId('import-row-8')).getByRole('checkbox')).not.toBeChecked()
  })
})

describe('ImportStatementDialog — saldo, investimento e fatura', () => {
  it('links to the Pix receipt flow and to the reconciliation of old imports', async () => {
    const onReconcile = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ImportStatementDialog open onClose={vi.fn()} onReconcile={onReconcile} />)

    expect(screen.getByRole('button', { name: /lançar comprovante pix/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /corrigir importações antigas/i }))
    expect(onReconcile).toHaveBeenCalled()
  })

  it('header checkbox is mixed when only part of the rows is checked', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    // Marca a duplicata e desmarca uma nova: o total bate, mas nem todas as novas estão marcadas.
    await user.click(within(screen.getByTestId('import-row-8')).getByRole('checkbox'))
    await user.click(within(screen.getByTestId('import-row-9')).getByRole('checkbox'))

    const selectAll = screen.getByRole('checkbox', { name: /selecionar todos/i })
    expect(selectAll).not.toBeChecked()
    expect((selectAll as HTMLInputElement).indeterminate).toBe(true)
  })

  it('suggests keeping the current balance and sends the choice on commit', async () => {
    vi.mocked(previewStatementImport).mockResolvedValueOnce({
      ...MOCK_IMPORT_PREVIEW,
      keepCurrentBalanceSuggested: true,
    })
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByRole('checkbox', { name: /manter o saldo atual/i })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /importar 2 transações/i }))

    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    expect(getLastImportCommit()!.keepCurrentBalance).toBe(true)
  })

  it('offers to create an investment account when applications have nowhere to go', async () => {
    vi.mocked(previewStatementImport).mockResolvedValueOnce({
      ...MOCK_IMPORT_PREVIEW,
      investmentAccountMissing: true,
      rows: MOCK_IMPORT_PREVIEW.rows.map((row, i) =>
        i === 0 ? { ...row, investment: true } : row,
      ),
    })
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByText(/1 aplicação\(ões\) ou resgate\(s\)/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /criar conta "investimentos"/i }))
    // Criada a conta, a prévia é refeita para as linhas virarem transferência.
    await waitFor(() => expect(previewStatementImport).toHaveBeenCalledTimes(2))
  })

  it('flags an invoice payment with no invoice in the system', async () => {
    vi.mocked(previewStatementImport).mockResolvedValueOnce({
      ...MOCK_IMPORT_PREVIEW,
      rows: MOCK_IMPORT_PREVIEW.rows.map((row, i) =>
        i === 0 ? { ...row, invoicePaymentUnmatched: true } : row,
      ),
    })
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByText(/sem fatura correspondente/i)).toBeInTheDocument()
    expect(screen.getByText('sem fatura')).toBeInTheDocument()
  })
})

describe('ImportStatementDialog — edição na prévia', () => {
  async function editDescription(
    user: ReturnType<typeof userEvent.setup>,
    lineNumber: number,
    value: string,
  ) {
    const label = new RegExp(`descrição da linha ${lineNumber}`, 'i')
    await user.click(screen.getByRole('button', { name: label }))
    const input = screen.getByRole('textbox', { name: label })
    await user.clear(input)
    await user.type(input, `${value}{Enter}`)
  }

  /** O seletor é um popover: abre no gatilho da linha e escolhe a opção pelo nome. */
  async function pickCategory(
    user: ReturnType<typeof userEvent.setup>,
    lineNumber: number,
    categoryName: string,
  ) {
    const label = new RegExp(`categoria da linha ${lineNumber}`, 'i')
    await user.click(screen.getByRole('combobox', { name: label }))
    await user.click(await screen.findByRole('option', { name: categoryName }))
  }

  it('prefills the name the user gave that merchant before, without hiding the original', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const row = within(screen.getByTestId('import-row-8'))
    expect(row.getByRole('button', { name: /descrição da linha 8/i })).toHaveTextContent(
      'Padaria do Dias',
    )
    expect(row.getByText('apelido')).toBeInTheDocument()
    // O texto do extrato continua à vista para o usuário conferir.
    expect(row.getByText('Dias E Damasceno Ltda')).toBeInTheDocument()
  })

  it('does not mark a merchant that was never renamed', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(
      within(screen.getByTestId('import-row-7')).queryByText('apelido'),
    ).not.toBeInTheDocument()
  })

  it('gives the original back when the user asks for it', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const row = within(screen.getByTestId('import-row-8'))
    await user.click(row.getByRole('button', { name: 'usar original' }))

    expect(row.getByRole('button', { name: /descrição da linha 8/i })).toHaveTextContent(
      'Dias E Damasceno Ltda',
    )
    expect(row.queryByText('apelido')).not.toBeInTheDocument()
  })

  it('sends the original description alongside the one the user kept or wrote', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await editDescription(user, 7, 'Mercado do Zé')
    await user.click(within(screen.getByTestId('import-row-9')).getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /importar 1 transações/i }))

    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    // É a original que identifica o estabelecimento no servidor; sem ela, a memória de
    // apelido não teria como saber o que "Mercado do Zé" substitui.
    expect(getLastImportCommit()!.rows[0]).toMatchObject({
      description: 'Mercado do Zé',
      originalDescription: 'Pix Marketplace',
    })
  })

  it('sends the edited description instead of the one read from the file', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await editDescription(user, 7, 'Mercado do Zé')
    await user.click(within(screen.getByTestId('import-row-9')).getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /importar 1 transações/i }))

    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    expect(getLastImportCommit()!.rows[0].description).toBe('Mercado do Zé')
  })

  /**
   * O ponto mais delicado da edição: se a descrição participasse da identificação da
   * linha, renomear um lançamento faria o mesmo extrato ser importado duas vezes. O
   * hash é calculado no servidor a partir da linha original e o cliente só o devolve
   * intacto — este teste é o que garante que continua assim.
   */
  it('keeps the externalRef untouched when the description is edited', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await editDescription(user, 7, 'Outro nome completamente diferente')
    await user.click(within(screen.getByTestId('import-row-9')).getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /importar 1 transações/i }))

    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    expect(getLastImportCommit()!.rows[0].externalRef).toBe('ref-nova')
  })

  it('restores the previous description when the field is left empty', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    // Descrição é @NotBlank no backend: esvaziar não pode virar um 400 na confirmação.
    await user.click(screen.getByRole('button', { name: /descrição da linha 7/i }))
    const input = screen.getByRole('textbox', { name: /descrição da linha 7/i })
    await user.clear(input)
    await user.type(input, '{Enter}')

    expect(screen.getByRole('button', { name: /descrição da linha 7/i })).toHaveTextContent(
      'Pix Marketplace',
    )
  })

  it('discards the edit when Escape is pressed', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await user.click(screen.getByRole('button', { name: /descrição da linha 7/i }))
    const input = screen.getByRole('textbox', { name: /descrição da linha 7/i })
    await user.clear(input)
    await user.type(input, 'Nao quero isto{Escape}')

    expect(screen.getByRole('button', { name: /descrição da linha 7/i })).toHaveTextContent(
      'Pix Marketplace',
    )
  })

  it('sends the category chosen on a row that had no suggestion', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await pickCategory(user, 9, 'Restaurant')
    await user.click(within(screen.getByTestId('import-row-7')).getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /importar 1 transações/i }))

    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    expect(getLastImportCommit()!.rows[0]).toMatchObject({
      externalRef: 'ref-revisar',
      categoryId: 'cat-3',
    })
  })

  it('clears the suggested category when "sem categoria" is chosen', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await pickCategory(user, 7, 'sem categoria')
    await user.click(within(screen.getByTestId('import-row-9')).getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /importar 1 transações/i }))

    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    expect(getLastImportCommit()!.rows[0].categoryId).toBeUndefined()
  })

  it('applies a category to every row the bank described the same way', async () => {
    vi.mocked(previewStatementImport).mockImplementationOnce(async () =>
      previewWithRepeatedMerchant(),
    )
    const user = userEvent.setup()
    renderDialog()
    await waitFor(() => screen.getByRole('option', { name: 'Nubank' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: /conta de destino/i }),
      'account-1',
    )
    await user.upload(screen.getByLabelText(/arquivo/i), csvFile())
    await user.click(screen.getByRole('button', { name: /analisar arquivo/i }))
    await waitFor(() => expect(screen.getAllByText('Sorveteka Penapolis Bra')).toHaveLength(2))

    await pickCategory(user, 10, 'Food')
    await user.click(screen.getByRole('button', { name: /aplicar a \+1 iguais/i }))

    await user.click(screen.getByRole('button', { name: /importar 3 transações/i }))

    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    const rows = getLastImportCommit()!.rows
    // As duas Sorveteka recebem a categoria; a linha de outro estabelecimento não.
    expect(rows.find((row) => row.externalRef === 'ref-sorvete-1')?.categoryId).toBe('cat-1')
    expect(rows.find((row) => row.externalRef === 'ref-sorvete-2')?.categoryId).toBe('cat-1')
    expect(rows.find((row) => row.externalRef === 'ref-outra')?.categoryId).toBeUndefined()
  })

  it('shows where an investment or invoice payment goes and sends it back on commit', async () => {
    const base = previewWithRepeatedMerchant()
    vi.mocked(previewStatementImport).mockImplementationOnce(async () => ({
      ...base,
      totalRows: 2,
      importableCount: 2,
      rows: [
        {
          ...base.rows[0],
          externalRef: 'ref-cdb',
          description: 'Cdb Porq Obj Banco Inter',
          type: 'TRANSFER',
          outgoing: true,
          transferAccountId: 'account-invest',
          transferAccountName: 'Investimentos',
        },
        {
          ...base.rows[2],
          externalRef: 'ref-fatura',
          description: 'Pagamento Fatura',
          type: 'INVOICE_PAYMENT',
          invoiceId: 'invoice-9',
          invoiceLabel: 'Inter - PF · 2026-09',
          invoiceOptions: [INVOICE_SEP],
        },
      ],
    }))
    const user = userEvent.setup()
    renderDialog()
    await waitFor(() => screen.getByRole('option', { name: 'Nubank' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: /conta de destino/i }),
      'account-1',
    )
    await user.upload(screen.getByLabelText(/arquivo/i), csvFile())
    await user.click(screen.getByRole('button', { name: /analisar arquivo/i }))

    expect(await screen.findByText('para Investimentos')).toBeInTheDocument()
    expect(screen.getByText('fatura Inter - PF · 2026-09')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /importar 2 transações/i }))

    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    const rows = getLastImportCommit()!.rows
    expect(rows.find((row) => row.externalRef === 'ref-cdb')).toMatchObject({
      type: 'TRANSFER',
      outgoing: true,
      transferAccountId: 'account-invest',
    })
    expect(rows.find((row) => row.externalRef === 'ref-fatura')).toMatchObject({
      type: 'INVOICE_PAYMENT',
      invoiceId: 'invoice-9',
    })
  })

  it('keeps a payment that does not match the invoice total as expense, flagged for review', async () => {
    vi.mocked(previewStatementImport).mockImplementationOnce(async () =>
      previewWithSingleRow({
        description: 'Pagamento Fatura',
        invoiceId: 'invoice-9',
        invoiceLabel: 'Inter - PF · 2026-09',
        invoiceAmountMismatch: true,
        invoiceOptions: [INVOICE_SEP],
      }),
    )
    const user = userEvent.setup()
    renderDialog()
    await analyzeFile(user)

    expect(await screen.findByText('possível fatura Inter - PF · 2026-09')).toBeInTheDocument()
    expect(screen.getByTitle(/não bate com o total da fatura/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tipo da linha 10' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Tipo da linha 10' }),
      'INVOICE_PAYMENT',
    )
    await user.click(screen.getByRole('button', { name: 'ok' }))

    expect(screen.getByText('fatura Inter - PF · 2026-09')).toBeInTheDocument()
    expect(screen.queryByTitle(/não bate com o total da fatura/)).toBeNull()

    await user.click(screen.getByRole('button', { name: /importar 1 transações/i }))
    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    expect(getLastImportCommit()!.rows[0]).toMatchObject({
      type: 'INVOICE_PAYMENT',
      invoiceId: 'invoice-9',
      transferAccountId: null,
    })
    // Sem categoria: transferência e pagamento de fatura não são gasto.
    expect(getLastImportCommit()!.rows[0].categoryId).toBeUndefined()
  })

  it('turns an expense into a transfer to another account, without category', async () => {
    vi.mocked(previewStatementImport).mockImplementationOnce(async () =>
      previewWithSingleRow({ description: 'Cdb Porq', suggestedCategoryId: 'cat-1' }),
    )
    const user = userEvent.setup()
    renderDialog()
    await analyzeFile(user)

    await user.click(await screen.findByRole('button', { name: 'Tipo da linha 10' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tipo da linha 10' }), 'TRANSFER')

    // A importada (Nubank) não é oferecida como o outro lado.
    const target = screen.getByRole('combobox', { name: 'Conta de destino da linha 10' })
    expect(within(target).queryByRole('option', { name: 'Nubank' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'ok' }))
    expect(screen.getByText('para Savings')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /importar 1 transações/i }))
    await waitFor(() => expect(getLastImportCommit()).not.toBeNull())
    expect(getLastImportCommit()!.rows[0]).toMatchObject({
      type: 'TRANSFER',
      outgoing: true,
      transferAccountId: 'account-2',
    })
    // Sem categoria: transferência e pagamento de fatura não são gasto.
    expect(getLastImportCommit()!.rows[0].categoryId).toBeUndefined()
  })

  it('does not offer "apply to similar" when no other row matches', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await pickCategory(user, 9, 'Restaurant')

    expect(screen.queryByRole('button', { name: /aplicar a \+/i })).toBeNull()
  })

  /**
   * Uma sugestão vinda do histórico é um palpite estatístico, não uma decisão do
   * usuário como uma regra — por isso fica marcada até ser revisada.
   */
  it('marks an unreviewed history suggestion, but not a row with no suggestion', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(within(screen.getByTestId('import-row-7')).getByText('histórico')).toBeInTheDocument()
    expect(within(screen.getByTestId('import-row-8')).queryByText('histórico')).toBeNull()
  })

  it('drops the history badge once the user picks a category for that row', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await pickCategory(user, 7, 'Restaurant')

    expect(within(screen.getByTestId('import-row-7')).queryByText('histórico')).toBeNull()
  })

  /**
   * O contador conta RULE fora — regra é intenção declarada, não palpite a revisar —
   * e deixa pular direto para a próxima linha pendente.
   */
  it('offers to jump to the rows still needing a confirmed category', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByText(/3 sem categoria confirmada/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^revisar$/i }))

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /categoria da linha 7/i })).toHaveFocus(),
    )
  })

  describe('fetching from the bank', () => {
    function linkAccount1() {
      server.use(
        http.get('*/bank-connections', () =>
          HttpResponse.json({
            enabled: true,
            connections: [
              {
                id: 'conn-1',
                itemId: 'item-1',
                connectorName: 'MeuPluggy',
                status: 'UPDATED',
                statusDetail: null,
                lastSyncedAt: null,
                accounts: [
                  {
                    id: 'ba-1',
                    kind: 'BANK',
                    name: 'BANCO INTER',
                    number: '1',
                    accountId: 'account-1',
                    creditCardId: null,
                  },
                ],
              },
            ],
          }),
        ),
      )
    }

    async function chooseAccount(user: ReturnType<typeof userEvent.setup>, id: string) {
      await waitFor(() => screen.getByRole('option', { name: 'Nubank' }))
      await user.selectOptions(screen.getByRole('combobox', { name: /conta de destino/i }), id)
    }

    it('is offered only for an account linked to the bank', async () => {
      linkAccount1()
      const user = userEvent.setup()
      renderDialog()
      await chooseAccount(user, 'account-1')

      expect(await screen.findByRole('button', { name: /buscar do banco/i })).toBeInTheDocument()

      await user.selectOptions(screen.getByRole('combobox', { name: /conta de destino/i }), '')
      expect(screen.queryByRole('button', { name: /buscar do banco/i })).not.toBeInTheDocument()
    })

    it('opens the same review with possible duplicates unchecked and commits as OPEN_FINANCE', async () => {
      linkAccount1()
      const base = previewWithRepeatedMerchant()
      server.use(
        http.post('*/transactions/import/bank-preview', () =>
          HttpResponse.json({
            ...base,
            fileName: null,
            format: 'OPEN_FINANCE',
            sourceAccountLabel: 'BANCO INTER · 1',
            totalRows: 2,
            importableCount: 2,
            rows: [
              { ...base.rows[0], externalRef: 'plg:a', description: 'Padaria' },
              {
                ...base.rows[1],
                externalRef: 'plg:b',
                description: 'Pix Marketplace',
                possibleDuplicate: true,
              },
            ],
          }),
        ),
      )
      const user = userEvent.setup()
      const { onClose } = renderDialog()
      await chooseAccount(user, 'account-1')
      await user.click(await screen.findByRole('button', { name: /buscar do banco/i }))

      expect(await screen.findByText('possível duplicata')).toBeInTheDocument()
      expect(screen.getByText(/BANCO INTER · 1/)).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'Importar Padaria' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Importar Pix Marketplace' })).not.toBeChecked()

      await user.click(screen.getByRole('button', { name: /importar 1 transações/i }))
      await waitFor(() => expect(onClose).toHaveBeenCalled())
      const commit = getLastImportCommit()
      expect(commit!.format).toBe('OPEN_FINANCE')
      expect(commit!.rows.map((row) => row.externalRef)).toEqual(['plg:a'])
    })

    it('says so when the bank has nothing new', async () => {
      linkAccount1()
      server.use(
        http.post('*/transactions/import/bank-preview', () =>
          HttpResponse.json({
            ...MOCK_IMPORT_PREVIEW,
            fileName: null,
            format: 'OPEN_FINANCE',
            totalRows: 0,
            importableCount: 0,
            duplicateCount: 0,
            warningCount: 0,
            rows: [],
          }),
        ),
      )
      const user = userEvent.setup()
      renderDialog()
      await chooseAccount(user, 'account-1')
      await user.click(await screen.findByRole('button', { name: /buscar do banco/i }))

      expect(await screen.findByText(/nada novo no banco/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /importar 0 transações/i })).toBeDisabled()
    })
  })
})
