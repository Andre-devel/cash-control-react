import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import {
  resetCardsStore,
  resetFaturaImportStore,
  setFaturaImportDuplicates,
  getLastFaturaCommit,
  MOCK_FATURA_PREVIEW,
} from '@/test/handlers/cards.handlers'
import type * as FaturaImportApi from '@/features/cards/api/fatura-import.api'
import { ImportFaturaDialog } from '../import-fatura-dialog'

// O XHR do jsdom trava num POST multipart com arquivo, então a prévia não pode passar
// pelo MSW como as demais chamadas. O formato do upload é coberto em
// api/__tests__/fatura-import.api.test.ts; aqui o que importa é o comportamento da
// tela. A confirmação continua indo pelo MSW normalmente — ela é JSON.
vi.mock('@/features/cards/api/fatura-import.api', async (importOriginal) => {
  const actual = await importOriginal<typeof FaturaImportApi>()
  return {
    ...actual,
    previewFaturaImport: vi.fn(async () => MOCK_FATURA_PREVIEW),
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
  resetCardsStore()
  resetFaturaImportStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

function renderDialog(open = true) {
  const onClose = vi.fn()
  renderWithProviders(<ImportFaturaDialog open={open} onClose={onClose} />)
  return { onClose }
}

function pdfFile() {
  return new File(['%PDF-1.4'], 'fatura-inter-2026-07.pdf', { type: 'application/pdf' })
}

/**
 * As contas chegam por query, então o `select` existe antes das opções: esperar só pelo
 * combobox deixa o teste escolher um valor que ainda não está lá.
 */
async function chooseAccount(user: ReturnType<typeof userEvent.setup>) {
  const account = await screen.findByRole('option', { name: 'Nubank' })
  await user.selectOptions(
    screen.getByRole('combobox', { name: /conta dos lançamentos/i }),
    account as HTMLOptionElement,
  )
}

/** Passo 1 completo: conta escolhida, arquivo enviado, prévia carregada. */
async function reachPreview(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText(/arquivo/i), pdfFile())
  await chooseAccount(user)
  await user.click(screen.getByRole('button', { name: /analisar arquivo/i }))
  await waitFor(() => expect(screen.getByText(/SHOPEE \*LarkSpComercio/)).toBeInTheDocument())
}

describe('ImportFaturaDialog', () => {
  it('does not render when open is false', () => {
    renderDialog(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  /**
   * Diferente do extrato: o cartão não é escolhido antes da leitura, porque só o PDF
   * diz quantos cartões existem. A conta é: ela não sai do arquivo.
   */
  it('asks for the account and the file, but not the card, before analysing', async () => {
    const user = userEvent.setup()
    renderDialog()

    expect(screen.queryByRole('combobox', { name: /cartão da seção/i })).toBeNull()

    const analyze = screen.getByRole('button', { name: /analisar arquivo/i })
    expect(analyze).toBeDisabled()

    await user.upload(screen.getByLabelText(/arquivo/i), pdfFile())
    expect(analyze).toBeDisabled()

    await chooseAccount(user)
    expect(analyze).toBeEnabled()
  })

  it('renders one card selector per section of the PDF', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByRole('combobox', { name: /cartão da seção 7866/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /cartão da seção 9999/i })).toBeInTheDocument()
  })

  it('preselects the card matched by last4Digits and leaves the unmatched one empty', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByRole('combobox', { name: /cartão da seção 7866/i })).toHaveValue('card-1')
    expect(screen.getByRole('combobox', { name: /cartão da seção 9999/i })).toHaveValue('')
  })

  it('leaves already-imported rows unchecked', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const duplicateRow = screen.getByTestId('fatura-row-60')
    expect(within(duplicateRow).getByRole('checkbox')).not.toBeChecked()
    expect(within(duplicateRow).getByText(/já importada/i)).toBeInTheDocument()

    expect(within(screen.getByTestId('fatura-row-59')).getByRole('checkbox')).toBeChecked()
  })

  it('shows the installment position of each row', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(within(screen.getByTestId('fatura-row-59')).getByText('4/5')).toBeInTheDocument()
    expect(within(screen.getByTestId('fatura-row-60')).getByText('—')).toBeInTheDocument()
  })

  it('reports rows that could not be read', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    // Há dois alerts na tela: as linhas ilegíveis e o aviso de cartão faltando.
    expect(
      screen
        .getAllByRole('alert')
        .map((alert) => alert.textContent)
        .join(' '),
    ).toMatch(/linha 61/i)
  })

  /**
   * O ponto mais delicado da tela: um grupo sem cartão escolhido não tem para onde ir.
   * Deixar confirmar geraria um 400 depois de o usuário já ter revisado tudo.
   */
  it('blocks the import while a selected group has no card', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByRole('button', { name: /importar 2 lançamentos/i })).toBeDisabled()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /cartão da seção 9999/i }),
      'card-2',
    )
    expect(screen.getByRole('button', { name: /importar 2 lançamentos/i })).toBeEnabled()
  })

  it('allows importing when the group without a card has no row selected', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    // Desmarcando a única linha do grupo sem cartão, ele deixa de ser um bloqueio.
    await user.click(within(screen.getByTestId('fatura-row-70')).getByRole('checkbox'))

    expect(screen.getByRole('button', { name: /importar 1 lançamentos/i })).toBeEnabled()
  })

  it('sends each row with the card chosen for its own group', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()
    await reachPreview(user)

    await user.selectOptions(
      screen.getByRole('combobox', { name: /cartão da seção 9999/i }),
      'card-2',
    )
    await user.click(screen.getByRole('button', { name: /importar 2 lançamentos/i }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())

    const commit = getLastFaturaCommit()
    expect(commit).not.toBeNull()
    expect(commit!.format).toBe('INTER_FATURA_PDF')
    expect(commit!.referenceMonth).toBe('2026-07')
    expect(commit!.accountId).toBe('account-1')
    expect(commit!.rows).toHaveLength(2)
    expect(commit!.rows[0]).toMatchObject({
      creditCardId: 'card-1',
      cardLast4: '7866',
      externalRef: 'ref-nova',
      date: '2026-04-04',
      description: 'SHOPEE *LarkSpComercio (Parcela 04 de 05)',
      originalDescription: 'SHOPEE *LarkSpComercio (Parcela 04 de 05)',
      amount: '55.19',
      installmentNumber: 4,
      totalInstallments: 5,
      categoryId: 'cat-1',
    })
    expect(commit!.rows[1]).toMatchObject({
      creditCardId: 'card-2',
      cardLast4: '9999',
      externalRef: 'ref-sem-cartao',
    })
  })

  /**
   * A conta é do arquivo, não do cartão: dois cartões no mesmo PDF vão para a mesma
   * conta, e é ela que o servidor usa para criar as transações.
   */
  it('sends one account for every row, across both cards', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await user.selectOptions(
      screen.getByRole('combobox', { name: /cartão da seção 9999/i }),
      'card-2',
    )
    await user.click(screen.getByRole('button', { name: /importar 2 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    expect(getLastFaturaCommit()!.accountId).toBe('account-1')
    expect(new Set(getLastFaturaCommit()!.rows.map((row) => row.creditCardId))).toEqual(
      new Set(['card-1', 'card-2']),
    )
  })

  it('never sends a row the user left unchecked, even a duplicate', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await user.selectOptions(
      screen.getByRole('combobox', { name: /cartão da seção 9999/i }),
      'card-2',
    )
    await user.click(screen.getByRole('button', { name: /importar 2 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    expect(getLastFaturaCommit()!.rows.map((row) => row.externalRef)).toEqual([
      'ref-nova',
      'ref-sem-cartao',
    ])
  })

  it('select-all toggles only its own group, without touching duplicates', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await user.click(screen.getByRole('checkbox', { name: /selecionar todos do cartão 7866/i }))
    // Só a linha do primeiro grupo saiu; a do segundo continua marcada.
    expect(screen.getByRole('button', { name: /importar 1 lançamentos/i })).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /selecionar todos do cartão 7866/i }))
    expect(screen.getByRole('button', { name: /importar 2 lançamentos/i })).toBeInTheDocument()
    expect(within(screen.getByTestId('fatura-row-60')).getByRole('checkbox')).not.toBeChecked()
  })

  it('sends the category chosen on a row that had no suggestion', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    // O seletor de categoria é um popover: abre no gatilho da linha e escolhe pelo nome.
    await user.click(screen.getByRole('combobox', { name: /categoria da linha 70/i }))
    await user.click(await screen.findByRole('option', { name: 'Restaurant' }))

    await user.selectOptions(
      screen.getByRole('combobox', { name: /cartão da seção 9999/i }),
      'card-2',
    )
    await user.click(screen.getByRole('button', { name: /importar 2 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    expect(getLastFaturaCommit()!.rows[1]).toMatchObject({
      externalRef: 'ref-sem-cartao',
      categoryId: 'cat-3',
    })
  })

  /**
   * A descrição do PDF é críptica ("SHOPEE *LarkSpComercio"); poder reescrever antes de
   * gravar é o mesmo ganho do import de extrato.
   */
  it('sends the description rewritten on a row, keeping the original alongside', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const label = /descrição da linha 59/i
    await user.click(screen.getByRole('button', { name: label }))
    await user.clear(screen.getByRole('textbox', { name: label }))
    await user.type(screen.getByRole('textbox', { name: label }), 'Fone de ouvido')
    await user.tab()

    await user.click(within(screen.getByTestId('fatura-row-70')).getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /importar 1 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    expect(getLastFaturaCommit()!.rows[0]).toMatchObject({
      description: 'Fone de ouvido',
      // A original vai intacta: é dela que sai a chave das parcelas futuras.
      originalDescription: 'SHOPEE *LarkSpComercio (Parcela 04 de 05)',
    })
  })

  it('keeps an emptied description as it was, since the backend requires one', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const label = /descrição da linha 59/i
    await user.click(screen.getByRole('button', { name: label }))
    await user.clear(screen.getByRole('textbox', { name: label }))
    await user.tab()

    expect(screen.getByRole('button', { name: label })).toHaveTextContent(
      'SHOPEE *LarkSpComercio (Parcela 04 de 05)',
    )
  })

  it('clears the suggested category when "sem categoria" is chosen', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await user.click(screen.getByRole('combobox', { name: /categoria da linha 59/i }))
    await user.click(await screen.findByRole('option', { name: 'sem categoria' }))

    await user.click(within(screen.getByTestId('fatura-row-70')).getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /importar 1 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    expect(getLastFaturaCommit()!.rows[0].categoryId).toBeUndefined()
  })

  it('does not mark the invoice as paid unless the user asks', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await user.selectOptions(
      screen.getByRole('combobox', { name: /cartão da seção 9999/i }),
      'card-2',
    )
    await user.click(screen.getByRole('button', { name: /importar 2 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    expect(getLastFaturaCommit()!.alreadyPaid).toBe(false)
  })

  /**
   * Importar histórico já quitado: o checkbox só aparece depois da prévia (quando já se
   * sabe qual é a fatura) e vai no commit como `alreadyPaid`.
   */
  it('sends alreadyPaid when the "invoice already paid" option is checked', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await user.click(screen.getByRole('checkbox', { name: /esta fatura já está paga/i }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: /cartão da seção 9999/i }),
      'card-2',
    )
    await user.click(screen.getByRole('button', { name: /importar 2 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    expect(getLastFaturaCommit()!.alreadyPaid).toBe(true)
  })

  /**
   * A prévia só marca duplicatas do grupo cujo cartão ela sugeriu. Escolher o cartão de
   * destino à mão — um cartão virtual, cujos 4 dígitos não batem com nenhum cadastrado —
   * refaz a marcação contra a fatura desse cartão.
   */
  it('flags the rows already imported on a card chosen by hand', async () => {
    setFaturaImportDuplicates('card-2', ['ref-sem-cartao'])
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const row = screen.getByTestId('fatura-row-70')
    expect(within(row).queryByText(/já importada/i)).toBeNull()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /cartão da seção 9999/i }),
      'card-2',
    )

    await waitFor(() => expect(within(row).getByText(/já importada/i)).toBeInTheDocument())
    expect(within(row).getByRole('checkbox')).not.toBeChecked()
    expect(screen.getByText(/2 já importados/i)).toBeInTheDocument()
  })

  it('never sends a row already imported on the card chosen by hand', async () => {
    setFaturaImportDuplicates('card-2', ['ref-sem-cartao'])
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await user.selectOptions(
      screen.getByRole('combobox', { name: /cartão da seção 9999/i }),
      'card-2',
    )

    const importButton = await screen.findByRole('button', { name: /importar 1 lançamentos/i })
    await user.click(importButton)

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    expect(getLastFaturaCommit()!.rows).toHaveLength(1)
    expect(getLastFaturaCommit()!.rows[0].externalRef).toBe('ref-nova')
  })

  /** Trocar para um cartão que não tem a compra devolve a linha à seleção. */
  it('unflags the row when the destination card changes to one without it', async () => {
    setFaturaImportDuplicates('card-2', ['ref-sem-cartao'])
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const group = screen.getByRole('combobox', { name: /cartão da seção 9999/i })
    await user.selectOptions(group, 'card-2')
    const row = screen.getByTestId('fatura-row-70')
    await waitFor(() => expect(within(row).getByText(/já importada/i)).toBeInTheDocument())

    await user.selectOptions(group, 'card-1')

    await waitFor(() => expect(within(row).queryByText(/já importada/i)).toBeNull())
    expect(within(row).getByRole('checkbox')).toBeChecked()
    expect(screen.getByRole('button', { name: /importar 2 lançamentos/i })).toBeInTheDocument()
  })

  it('summarises the reading, including the discarded payments', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByText(/1 pagamentos ignorados/i)).toBeInTheDocument()
    expect(screen.getByText('2026-07')).toBeInTheDocument()
  })
})
