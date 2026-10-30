import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  resetCardsStore,
  resetFaturaImportStore,
  setFaturaImportDuplicates,
  getLastFaturaCommit,
  MOCK_FATURA_PREVIEW,
} from '@/test/handlers/cards.handlers'
import type * as FaturaImportApi from '@/features/cards/api/fatura-import.api'
import { previewFaturaImport } from '@/features/cards/api/fatura-import.api'
import type { FaturaImportPreviewResponse, FaturaImportPreviewRow } from '@/features/cards/types'
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

/** Prévia com o mesmo estabelecimento repetido, que é o caso do "aplicar ao estabelecimento". */
function previewWithRepeatedMerchant(): FaturaImportPreviewResponse {
  const row = (lineNumber: number, externalRef: string): FaturaImportPreviewRow => ({
    lineNumber,
    externalRef,
    ordinal: 0,
    date: '2026-07-19',
    description: 'Sorveteka Penapolis Bra',
    amount: '65.30',
    installmentNumber: null,
    totalInstallments: null,
    merchantKey: 'sorveteka penapolis',
    suggestedDescription: null,
    suggestedCategoryId: null,
    suggestedCategoryName: null,
    suggestedSubcategoryId: null,
    suggestedSubcategoryName: null,
    suggestionSource: 'NONE',
    duplicate: false,
    refund: false,
    possibleDuplicate: false,
  })

  return {
    ...MOCK_FATURA_PREVIEW,
    totalRows: 2,
    duplicateCount: 0,
    errors: [],
    groups: [
      {
        cardLast4: '7866',
        suggestedCreditCardId: 'card-1',
        suggestedCreditCardName: 'Nubank',
        rows: [row(10, 'ref-sorvete-1'), row(11, 'ref-sorvete-2')],
      },
    ],
  }
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

  it('names the section that still needs a card and explains the disabled button', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByText(/cartão final 9999 \(adicional ou virtual\)/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /importar 2 lançamentos/i })).toHaveAttribute(
      'title',
      'Escolha o cartão da seção ****9999',
    )
    await user.click(screen.getByRole('button', { name: /ir para a seção/i }))
    expect(screen.getByRole('combobox', { name: /cartão da seção 9999/i })).toHaveFocus()
  })

  it('shows how far the rows read are from the total printed on the PDF', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByText(/difere do total do pdf/i)).toBeInTheDocument()
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
    // A já importada vai junto, para o servidor corrigir o valor dela (ver o teste abaixo).
    expect(commit!.rows).toHaveLength(3)
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
    expect(commit!.rows[2]).toMatchObject({
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

  /**
   * A já importada não grava nada de novo, mas é por ela que o servidor troca o valor da
   * parcela que nasceu por estimativa (56,15) pelo que o PDF cobra (56,08).
   */
  it('sends the rows already imported along, to correct their amount', async () => {
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
      'ref-ja-importada',
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

  it('shows a refund in green with a minus sign and sends it as refund', async () => {
    const base = MOCK_FATURA_PREVIEW
    vi.mocked(previewFaturaImport).mockImplementationOnce(async () => ({
      ...base,
      groups: [
        {
          ...base.groups[0],
          rows: [
            {
              ...base.groups[0].rows[0],
              externalRef: 'ref-estorno',
              description: 'MERCADOLIVRE*MELI',
              amount: '96.98',
              installmentNumber: null,
              totalInstallments: null,
              refund: true,
            },
          ],
        },
      ],
    }))
    const user = userEvent.setup()
    renderDialog()
    await user.upload(screen.getByLabelText(/arquivo/i), pdfFile())
    await chooseAccount(user)
    await user.click(screen.getByRole('button', { name: /analisar arquivo/i }))
    await waitFor(() => expect(screen.getByText('MERCADOLIVRE*MELI')).toBeInTheDocument())

    expect(screen.getByText('estorno')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /importar 1 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    expect(getLastFaturaCommit()!.rows).toEqual([
      expect.objectContaining({ externalRef: 'ref-estorno', refund: true, amount: '96.98' }),
    ])
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
    expect(getLastFaturaCommit()!.rows[2]).toMatchObject({
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

  it('prefills the name the user gave that merchant before, without hiding the original', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const row = within(screen.getByTestId('fatura-row-60'))
    // O que a linha vai levar é o apelido lembrado...
    expect(row.getByRole('button', { name: /descrição da linha 60/i })).toHaveTextContent(
      'Claude - mensalidade',
    )
    expect(row.getByText('apelido')).toBeInTheDocument()
    // ...e o texto ilegível da fatura continua à vista, que é como o usuário confere.
    expect(row.getByText('ANTHROPIC* CLAUDE SUB')).toBeInTheDocument()
  })

  it('does not mark a merchant that was never renamed', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const row = within(screen.getByTestId('fatura-row-59'))
    expect(row.queryByText('apelido')).not.toBeInTheDocument()
    expect(row.getByRole('button', { name: /descrição da linha 59/i })).toHaveTextContent(
      'SHOPEE *LarkSpComercio (Parcela 04 de 05)',
    )
  })

  it('sends the remembered name when the user leaves the prefilled row as it is', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    // A linha vem desmarcada por ser duplicata; marcá-la é o que a coloca no envio. A 70
    // sai porque a seção dela não tem cartão escolhido e bloquearia a importação.
    await user.click(within(screen.getByTestId('fatura-row-60')).getByRole('checkbox'))
    await user.click(within(screen.getByTestId('fatura-row-70')).getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /importar 2 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    const sent = getLastFaturaCommit()!.rows.find((row) => row.externalRef === 'ref-ja-importada')
    expect(sent).toMatchObject({
      description: 'Claude - mensalidade',
      // A do arquivo vai junto: é com ela que o servidor reconhece o estabelecimento.
      originalDescription: 'ANTHROPIC* CLAUDE SUB',
    })
  })

  it('gives the original back when the user asks for it', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    const row = within(screen.getByTestId('fatura-row-60'))
    await user.click(row.getByRole('button', { name: 'usar original' }))

    expect(row.getByRole('button', { name: /descrição da linha 60/i })).toHaveTextContent(
      'ANTHROPIC* CLAUDE SUB',
    )
    // Sem apelido em vigor não há o que desfazer, nem o que sinalizar.
    expect(row.queryByText('apelido')).not.toBeInTheDocument()
    expect(row.queryByRole('button', { name: 'usar original' })).not.toBeInTheDocument()
  })

  it('applies a rewritten name to every other row of the same estabelecimento', async () => {
    vi.mocked(previewFaturaImport).mockImplementationOnce(async () => previewWithRepeatedMerchant())
    const user = userEvent.setup()
    renderDialog()
    await user.upload(screen.getByLabelText(/arquivo/i), pdfFile())
    await chooseAccount(user)
    await user.click(screen.getByRole('button', { name: /analisar arquivo/i }))
    await waitFor(() => expect(screen.getAllByText('Sorveteka Penapolis Bra')).toHaveLength(2))

    const label = /descrição da linha 10/i
    await user.click(screen.getByRole('button', { name: label }))
    await user.clear(screen.getByRole('textbox', { name: label }))
    await user.type(screen.getByRole('textbox', { name: label }), 'Sorveteria')
    await user.tab()

    await user.click(screen.getByRole('button', { name: /aplicar nome a \+1 do estabelecimento/i }))
    await user.click(screen.getByRole('button', { name: /importar 2 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    const rows = getLastFaturaCommit()!.rows
    expect(rows.find((row) => row.externalRef === 'ref-sorvete-1')?.description).toBe('Sorveteria')
    expect(rows.find((row) => row.externalRef === 'ref-sorvete-2')?.description).toBe('Sorveteria')
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

  it('treats a row already on the card chosen by hand as imported', async () => {
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
    // Só uma nova; as duas já importadas vão apenas para correção de valor.
    expect(getLastFaturaCommit()!.rows.map((row) => row.externalRef)).toEqual([
      'ref-nova',
      'ref-ja-importada',
      'ref-sem-cartao',
    ])
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
    expect(screen.getByText('Ago 2026')).toBeInTheDocument()
  })

  /**
   * Uma sugestão vinda do histórico é um palpite estatístico, não uma decisão do
   * usuário como uma regra — por isso fica marcada até ser revisada.
   */
  it('marks an unreviewed history suggestion, but not a row with no suggestion', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(within(screen.getByTestId('fatura-row-59')).getByText('histórico')).toBeInTheDocument()
    expect(within(screen.getByTestId('fatura-row-70')).queryByText('histórico')).toBeNull()
  })

  it('drops the history badge once the user picks a category for that row', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    await user.click(screen.getByRole('combobox', { name: /categoria da linha 59/i }))
    await user.click(await screen.findByRole('option', { name: 'Restaurant' }))

    expect(within(screen.getByTestId('fatura-row-59')).queryByText('histórico')).toBeNull()
  })

  /**
   * O contador conta RULE fora — regra é intenção declarada, não palpite a revisar —
   * e cai conforme cada linha é revisada.
   */
  it('offers to jump to the rows still needing a confirmed category', async () => {
    const user = userEvent.setup()
    renderDialog()
    await reachPreview(user)

    expect(screen.getByText(/3 sem categoria confirmada/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^revisar$/i }))

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /categoria da linha 59/i })).toHaveFocus(),
    )
  })

  it('applies a category to every other row of the same estabelecimento', async () => {
    vi.mocked(previewFaturaImport).mockImplementationOnce(async () => previewWithRepeatedMerchant())
    const user = userEvent.setup()
    renderDialog()
    await user.upload(screen.getByLabelText(/arquivo/i), pdfFile())
    await chooseAccount(user)
    await user.click(screen.getByRole('button', { name: /analisar arquivo/i }))
    await waitFor(() => expect(screen.getAllByText('Sorveteka Penapolis Bra')).toHaveLength(2))

    await user.click(screen.getByRole('combobox', { name: /categoria da linha 10/i }))
    await user.click(await screen.findByRole('option', { name: 'Restaurant' }))
    await user.click(screen.getByRole('button', { name: /aplicar a \+1 do estabelecimento/i }))

    await user.click(screen.getByRole('button', { name: /importar 2 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    const rows = getLastFaturaCommit()!.rows
    expect(rows.find((row) => row.externalRef === 'ref-sorvete-1')?.categoryId).toBe('cat-3')
    expect(rows.find((row) => row.externalRef === 'ref-sorvete-2')?.categoryId).toBe('cat-3')
  })
})

describe('ImportFaturaDialog — fetching from the bank', () => {
  function linkCard1() {
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
                  kind: 'CREDIT',
                  name: 'GOLD',
                  number: '7866',
                  accountId: null,
                  creditCardId: 'card-1',
                },
              ],
            },
          ],
        }),
      ),
      http.get('*/cards/card-1/bank-bills', () =>
        HttpResponse.json([
          { billId: 'bill-08', dueDate: '2026-08-07', totalAmount: '1617.29' },
          { billId: 'bill-07', dueDate: '2026-07-07', totalAmount: '2241.47' },
        ]),
      ),
    )
  }

  it('is not offered without a linked card', async () => {
    renderDialog()
    await screen.findByRole('option', { name: 'Nubank' })
    expect(screen.queryByRole('button', { name: /buscar do banco/i })).not.toBeInTheDocument()
  })

  it('fetches the chosen bill, leaves possible duplicates unchecked and commits as OPEN_FINANCE', async () => {
    linkCard1()
    let requestedBill: string | null = null
    const base = previewWithRepeatedMerchant()
    server.use(
      http.post('*/cards/card-1/invoices/import/bank-preview', ({ request }) => {
        requestedBill = new URL(request.url).searchParams.get('billId')
        return HttpResponse.json({
          ...base,
          fileName: null,
          format: 'OPEN_FINANCE',
          groups: [
            {
              ...base.groups[0]!,
              rows: [
                base.groups[0]!.rows[0]!,
                { ...base.groups[0]!.rows[1]!, possibleDuplicate: true },
              ],
            },
          ],
        })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    const bills = await screen.findByRole('combobox', { name: /fatura do banco do cartão/i })
    await screen.findByRole('option', { name: /vence em 07\/07\/2026/i })
    await user.selectOptions(bills, 'bill-07')
    const fetch = screen.getByRole('button', { name: /buscar do banco/i })
    expect(fetch).toBeDisabled()

    await chooseAccount(user)
    await user.click(fetch)

    expect(await screen.findByText('possível duplicata')).toBeInTheDocument()
    expect(requestedBill).toBe('bill-07')
    expect(screen.getByText(/total no banco/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /importar 1 lançamentos/i }))

    await waitFor(() => expect(getLastFaturaCommit()).not.toBeNull())
    expect(getLastFaturaCommit()!.format).toBe('OPEN_FINANCE')
    expect(getLastFaturaCommit()!.rows.map((row) => row.externalRef)).toEqual(['ref-sorvete-1'])
  })
})
