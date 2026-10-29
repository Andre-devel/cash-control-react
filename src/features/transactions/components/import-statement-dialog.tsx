import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { FilePicker } from '@/components/ui/file-picker'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/money'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useCreateAccount } from '@/features/accounts/hooks/use-create-account'
import { useCategories } from '@/features/categories/hooks/use-categories'
import {
  EditableCategoryCell,
  EditableTextCell,
  EditableTypeCell,
} from '@/features/transactions/components/import-editable-cell'
import { useStatementImportPreview } from '@/features/transactions/hooks/use-statement-import-preview'
import { useCommitStatementImport } from '@/features/transactions/hooks/use-commit-statement-import'
import {
  STATEMENT_FORMATS,
  STATEMENT_FORMAT_LABELS,
  type ImportPreviewResponse,
  type ImportPreviewRow,
  type StatementFormat,
  type TransactionType,
} from '@/features/transactions/types'
import { formatLocalDate } from '@/lib/format-date'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  PIX: 'Pix',
  DEBIT_CARD: 'Cartão de débito',
  CREDIT_CARD: 'Cartão de crédito',
  BANK_TRANSFER: 'Transferência',
  BOLETO: 'Boleto',
  OTHER: 'Outros',
}

interface RowEdit {
  description?: string
  categoryId?: string | null
  type?: TransactionType
  transferAccountId?: string
  invoiceId?: string
}

/** Tipos que movem dinheiro sem ser gasto nem renda: não levam categoria. */
const MOVEMENT_TYPES: TransactionType[] = ['TRANSFER', 'INVOICE_PAYMENT']

/** Duas linhas são "iguais" quando o banco descreveu o mesmo estabelecimento. */
function descriptionKey(description: string): string {
  return description.trim().toLowerCase()
}

/**
 * Tipos que a linha pode assumir. Saída: despesa, transferência e — havendo fatura
 * vencendo perto — pagamento de fatura. Entrada: receita, estorno e transferência. O tipo
 * que o servidor deduziu entra sempre, mesmo fora dessa lista.
 */
function typeOptionsOf(row: ImportPreviewRow): TransactionType[] {
  const options: TransactionType[] = row.outgoing
    ? [
        'EXPENSE',
        'TRANSFER',
        ...(row.invoiceOptions.length > 0 ? ['INVOICE_PAYMENT' as const] : []),
      ]
    : ['INCOME', 'REFUND', 'TRANSFER']
  return options.includes(row.type) ? options : [row.type, ...options]
}

interface ImportStatementDialogProps {
  open: boolean
  onClose: () => void
  /** Abre a correção dos lançamentos importados antes das regras atuais. */
  onReconcile?: () => void
}

const LINK_CLASS =
  'rounded-xs font-semibold text-brand-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info'

/** Aviso de atenção (pendência que muda o resultado da importação). */
const WARN_NOTE_CLASS =
  'flex flex-col gap-2 rounded-lg bg-pending-soft px-3.5 py-2.5 text-body-sm text-fg'

/** Contadores da revisão: linhas lidas, já importadas, para revisar. */
function PreviewStat({ value, label, tone }: { value: number; label: string; tone?: string }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border p-2.5 ${
        tone ?? 'border-border bg-surface-1'
      }`}
    >
      <span className="text-[17px] font-bold leading-none">{value}</span>
      <span className="text-[11px] leading-none text-fg-muted">{label}</span>
    </div>
  )
}

export function ImportStatementDialog({ open, onClose, onReconcile }: ImportStatementDialogProps) {
  const { data: allAccounts = [] } = useAccounts()
  const accounts = useMemo(() => allAccounts.filter((a) => !a.archivedAt), [allAccounts])
  const { data: categories = [] } = useCategories()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [accountId, setAccountId] = useState('')
  const [format, setFormat] = useState<StatementFormat>('INTER_CSV')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  /**
   * Alterações do usuário, por `externalRef`. Ficam fora de `preview` de propósito:
   * a prévia é o que o servidor leu do arquivo, e é dela que sai o agrupamento de
   * "linhas iguais" — que continua estável mesmo depois de o usuário reescrever
   * uma das descrições.
   */
  const [edits, setEdits] = useState<Record<string, RowEdit>>({})
  const [keepCurrentBalance, setKeepCurrentBalance] = useState(false)
  const navigate = useNavigate()

  const { mutate: analyze, isPending: isAnalyzing } = useStatementImportPreview()
  const { mutate: commit, isPending: isImporting } = useCommitStatementImport()
  const { mutate: createAccount, isPending: isCreatingAccount } = useCreateAccount()

  function reset() {
    setAccountId('')
    setFormat('INTER_CSV')
    setFile(null)
    setPreview(null)
    setSelected(new Set())
    setEdits({})
    setKeepCurrentBalance(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /**
   * O que a linha vai levar como descrição: a edição desta sessão, senão o apelido que o
   * servidor lembrou para o estabelecimento, senão o texto do arquivo.
   */
  function descriptionOf(row: ImportPreviewRow): string {
    return edits[row.externalRef]?.description ?? row.suggestedDescription ?? row.description
  }

  function categoryIdOf(row: ImportPreviewRow): string | null {
    const edit = edits[row.externalRef]
    return edit && 'categoryId' in edit ? (edit.categoryId ?? null) : row.suggestedCategoryId
  }

  function typeOf(row: ImportPreviewRow): TransactionType {
    return edits[row.externalRef]?.type ?? row.type
  }

  /** Contas que podem estar do outro lado de uma transferência: todas menos a importada. */
  const transferAccounts = accounts.filter((a) => a.id !== accountId)

  function transferAccountIdOf(row: ImportPreviewRow): string | null {
    return (
      edits[row.externalRef]?.transferAccountId ??
      row.transferAccountId ??
      transferAccounts[0]?.id ??
      null
    )
  }

  function invoiceIdOf(row: ImportPreviewRow): string | null {
    return edits[row.externalRef]?.invoiceId ?? row.invoiceId ?? row.invoiceOptions[0]?.id ?? null
  }

  /** O que aparece embaixo do tipo: o outro lado da movimentação, ou a fatura sugerida. */
  function detailOf(row: ImportPreviewRow): string | null {
    const type = typeOf(row)
    if (type === 'TRANSFER') {
      const id = transferAccountIdOf(row)
      const name =
        transferAccounts.find((a) => a.id === id)?.name ??
        (id === row.transferAccountId ? row.transferAccountName : null)
      return name ? `${row.outgoing ? 'para' : 'de'} ${name}` : 'escolha a conta'
    }
    if (type === 'INVOICE_PAYMENT') {
      const label = row.invoiceOptions.find((o) => o.id === invoiceIdOf(row))?.label
      return label ? `fatura ${label}` : null
    }
    if (needsInvoiceReview(row)) return `possível fatura ${row.invoiceLabel}`
    return null
  }

  /** O seletor do outro lado, quando o tipo escolhido pede um. */
  function targetOf(row: ImportPreviewRow) {
    const type = typeOf(row)
    if (type === 'TRANSFER') {
      return {
        label: `Conta ${row.outgoing ? 'de destino' : 'de origem'} da linha ${row.lineNumber}`,
        value: transferAccountIdOf(row) ?? '',
        options: transferAccounts.map((a) => ({ value: a.id, label: a.name })),
        onChange: (transferAccountId: string) => editRow(row.externalRef, { transferAccountId }),
      }
    }
    if (type === 'INVOICE_PAYMENT') {
      return {
        label: `Fatura da linha ${row.lineNumber}`,
        value: invoiceIdOf(row) ?? '',
        options: row.invoiceOptions.map((o) => ({
          value: o.id,
          label: `${o.label} · ${Number(o.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        })),
        onChange: (invoiceId: string) => editRow(row.externalRef, { invoiceId }),
      }
    }
    return null
  }

  /** Valor não bate com a fatura sugerida, e o usuário ainda não decidiu o tipo. */
  function needsInvoiceReview(row: ImportPreviewRow): boolean {
    return row.invoiceAmountMismatch && edits[row.externalRef]?.type === undefined
  }

  function editRow(externalRef: string, patch: RowEdit) {
    setEdits((current) => ({ ...current, [externalRef]: { ...current[externalRef], ...patch } }))
  }

  /**
   * Chave de agrupamento de "linhas iguais": o `merchantKey` do servidor quando a
   * descrição deixou algo identificável, e a descrição normalizada quando não — mesma
   * regra que já valia antes de o servidor derivar o estabelecimento.
   */
  function similarityKey(row: ImportPreviewRow): string {
    return row.merchantKey ?? descriptionKey(row.description)
  }

  /**
   * Aplica a categoria a todas as linhas do mesmo estabelecimento — o mesmo mercado
   * costuma aparecer dezenas de vezes num extrato de dois anos, e classificar uma a uma
   * seria trabalho manual demais para o recurso valer a pena.
   */
  function applyCategoryToSimilar(row: ImportPreviewRow) {
    if (!preview) return
    const categoryId = categoryIdOf(row)
    const key = similarityKey(row)
    setEdits((current) => {
      const next = { ...current }
      for (const other of preview.rows) {
        if (similarityKey(other) === key) {
          next[other.externalRef] = { ...next[other.externalRef], categoryId }
        }
      }
      return next
    })
  }

  /**
   * Aplica a descrição às linhas do mesmo estabelecimento, como
   * {@link applyCategoryToSimilar} faz com a categoria: renomear é uma decisão sobre o
   * estabelecimento, não sobre a linha.
   */
  function applyDescriptionToSimilar(row: ImportPreviewRow) {
    if (!preview) return
    const description = descriptionOf(row)
    const key = similarityKey(row)
    setEdits((current) => {
      const next = { ...current }
      for (const other of preview.rows) {
        if (similarityKey(other) === key) {
          next[other.externalRef] = { ...next[other.externalRef], description }
        }
      }
      return next
    })
  }

  /** Quantas outras linhas são do mesmo estabelecimento que esta. */
  function similarCount(row: ImportPreviewRow): number {
    if (!preview) return 0
    const key = similarityKey(row)
    return preview.rows.filter((other) => similarityKey(other) === key).length - 1
  }

  /**
   * Linhas cuja sugestão ainda não foi confirmada e não veio de uma regra declarada pelo
   * usuário — as que valem a pena olhar antes de importar.
   */
  function reviewRows(): ImportPreviewRow[] {
    if (!preview) return []
    return preview.rows.filter(
      (row) =>
        !MOVEMENT_TYPES.includes(typeOf(row)) &&
        row.suggestionSource !== 'RULE' &&
        !('categoryId' in (edits[row.externalRef] ?? {})),
    )
  }

  /** Rola até a primeira linha pendente de revisão e leva o foco à sua categoria. */
  function jumpToReview() {
    const [target] = reviewRows()
    if (!target) return
    const rowEl = document.querySelector(`[data-testid="import-row-${target.lineNumber}"]`)
    // O jsdom não implementa scrollIntoView, e isto roda em teste também.
    if (rowEl instanceof HTMLElement && typeof rowEl.scrollIntoView === 'function') {
      rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    rowEl
      ?.querySelector<HTMLElement>(`[aria-label="Categoria da linha ${target.lineNumber}"]`)
      ?.focus()
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleAnalyze() {
    if (!file || !accountId) return
    analyze(
      { file, accountId, format },
      {
        onSuccess: (result) => {
          setPreview(result)
          setKeepCurrentBalance(result.keepCurrentBalanceSuggested)
          // Duplicatas já entraram numa importação anterior: vêm desmarcadas para
          // que confirmar sem revisar não seja um caminho para duplicar a base.
          setSelected(
            new Set(result.rows.filter((row) => !row.duplicate).map((row) => row.externalRef)),
          )
        },
      },
    )
  }

  function toggleRow(row: ImportPreviewRow) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(row.externalRef)) {
        next.delete(row.externalRef)
      } else {
        next.add(row.externalRef)
      }
      return next
    })
  }

  const importableRows = preview?.rows.filter((row) => !row.duplicate) ?? []
  const allImportableSelected =
    importableRows.length > 0 && importableRows.every((row) => selected.has(row.externalRef))

  function toggleAll() {
    setSelected(
      allImportableSelected ? new Set() : new Set(importableRows.map((row) => row.externalRef)),
    )
  }

  /** Aplicações viram transferência só com uma conta de investimento: cria e reanalisa. */
  function handleCreateInvestmentAccount() {
    createAccount({ name: 'Investimentos', type: 'INVESTMENT' }, { onSuccess: handleAnalyze })
  }

  function handleImport() {
    if (!preview) return
    const rows = preview.rows
      .filter((row) => selected.has(row.externalRef))
      .map((row) => ({
        lineNumber: row.lineNumber,
        externalRef: row.externalRef,
        date: row.date,
        // Descrição e categoria vão editadas; o externalRef vai como veio do servidor.
        // É ele, e não a descrição, que identifica a linha na deduplicação — por isso
        // reescrever a descrição aqui não faz o lançamento ser importado duas vezes.
        description: descriptionOf(row),
        // A do arquivo, sem edição: é a identidade com que o servidor grava — ou apaga —
        // o apelido do estabelecimento.
        originalDescription: row.description,
        amount: row.amount,
        type: typeOf(row),
        paymentMethod: row.paymentMethod,
        categoryId: MOVEMENT_TYPES.includes(typeOf(row))
          ? undefined
          : (categoryIdOf(row) ?? undefined),
        // Aplicação, resgate e pagamento de fatura: o servidor precisa do outro lado da
        // movimentação, que só a prévia sabe.
        outgoing: row.outgoing,
        transferAccountId: typeOf(row) === 'TRANSFER' ? transferAccountIdOf(row) : null,
        invoiceId: typeOf(row) === 'INVOICE_PAYMENT' ? invoiceIdOf(row) : null,
      }))

    commit({ accountId, format, rows, keepCurrentBalance }, { onSuccess: handleClose })
  }

  if (!open) return null

  const selectedCount = selected.size
  const subtitle = preview
    ? 'Passo 2 de 2 · confira os lançamentos antes de gravar'
    : 'Passo 1 de 2 · envie o arquivo do extrato para conferir os lançamentos antes de gravar'
  const reviewCount = reviewRows().length

  return (
    <Modal
      title="Importar extrato"
      subtitle={subtitle}
      onClose={handleClose}
      xwide
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          {preview ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleImport}
              disabled={isImporting || selectedCount === 0}
              aria-busy={isImporting}
            >
              {isImporting ? 'Importando…' : `Importar ${selectedCount} transações`}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !file || !accountId}
              aria-busy={isAnalyzing}
            >
              {isAnalyzing ? 'Analisando…' : 'Analisar arquivo'}
            </Button>
          )}
        </>
      }
    >
      {preview ? (
        <div className="flex flex-col gap-4">
          <div className="[display:grid] grid-cols-3 gap-1.5 md:max-w-[420px]">
            <PreviewStat value={preview.totalRows} label="linhas lidas" />
            <PreviewStat
              value={preview.duplicateCount}
              label="já importadas"
              tone={preview.duplicateCount > 0 ? 'border-transparent bg-overdue-soft' : undefined}
            />
            <PreviewStat
              value={preview.warningCount}
              label="para revisar"
              tone={preview.warningCount > 0 ? 'border-transparent bg-pending-soft' : undefined}
            />
          </div>

          {preview.sourceAccountLabel && (
            <div className="text-body-sm text-fg-muted">
              Conta no extrato: <strong>{preview.sourceAccountLabel}</strong>
              {preview.periodStart && preview.periodEnd && (
                <>
                  {' · '}Período de {formatLocalDate(preview.periodStart)} a{' '}
                  {formatLocalDate(preview.periodEnd)}
                </>
              )}
            </div>
          )}

          {preview.errors.length > 0 && (
            <div
              role="alert"
              className="rounded-lg bg-overdue-soft px-3.5 py-2.5 text-body-sm text-overdue"
            >
              {preview.errors.length} linha(s) não puderam ser lidas e ficarão de fora:{' '}
              {preview.errors
                .slice(0, 3)
                .map((error) => `linha ${error.lineNumber} (${error.message})`)
                .join('; ')}
              {preview.errors.length > 3 && '…'}
            </div>
          )}

          {preview.investmentAccountMissing && (
            <div role="note" className={WARN_NOTE_CLASS}>
              <span>
                {preview.rows.filter((row) => row.investment).length} aplicação(ões) ou resgate(s)
                de investimento no extrato. Sem uma conta de investimento eles entram como
                despesa/receita.
              </span>
              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-auto min-h-touch whitespace-normal py-2 text-left"
                  onClick={handleCreateInvestmentAccount}
                  disabled={isCreatingAccount || isAnalyzing}
                >
                  Criar conta &quot;Investimentos&quot; e lançar como transferência
                </Button>
              </div>
            </div>
          )}

          {preview.rows.some((row) => row.invoicePaymentUnmatched && !row.duplicate) && (
            <div role="note" className={WARN_NOTE_CLASS}>
              Há pagamento de fatura sem fatura correspondente no sistema (marcado com &quot;sem
              fatura&quot;). Importe a fatura do cartão antes, ou ele entra como despesa e as
              compras dela contam duas vezes.
            </div>
          )}

          {preview.keepCurrentBalanceSuggested && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-body-sm">
              <input
                type="checkbox"
                className="checkbox"
                checked={keepCurrentBalance}
                onChange={(e) => setKeepCurrentBalance(e.target.checked)}
              />
              <span>
                Manter o saldo atual da conta. O extrato tem lançamentos de antes da conta existir
                aqui, que já estão no saldo informado; um ajuste de saldo de abertura compensa o
                histórico importado.
              </span>
            </label>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm">
            <span className="text-fg-muted">
              {selectedCount} de {preview.rows.length} selecionadas
            </span>
            {reviewCount > 0 && (
              <span className="flex items-center gap-2">
                <span className="text-pending">{reviewCount} sem categoria confirmada</span>
                <button
                  type="button"
                  onClick={jumpToReview}
                  className={`min-h-touch ${LINK_CLASS}`}
                >
                  revisar
                </button>
              </span>
            )}
          </div>

          <div
            className="tbl-wrap stack-tbl-wrap statement-tbl-wrap"
            // A altura acompanha a janela para que só a tabela role: com um teto fixo, em
            // telas baixas o corpo do modal rolava junto e a página ficava com duas barras.
            style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}
          >
            <table className="tbl stack-tbl statement-tbl">
              <thead>
                <tr>
                  <th className="w-9 !pl-4">
                    <input
                      type="checkbox"
                      className="checkbox"
                      aria-label="Selecionar todos"
                      checked={allImportableSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = selectedCount > 0 && !allImportableSelected
                      }}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Histórico</th>
                  <th>Tipo</th>
                  <th>Forma de pagamento</th>
                  <th>Categoria</th>
                  <th className="num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => {
                  const isSelected = selected.has(row.externalRef)
                  return (
                    <tr
                      key={row.externalRef}
                      className={row.duplicate ? 'opacity-[.55]' : undefined}
                      data-testid={`import-row-${row.lineNumber}`}
                    >
                      <td className="cell-check !pl-4">
                        <input
                          type="checkbox"
                          className="checkbox"
                          aria-label={`Importar ${descriptionOf(row)}`}
                          checked={isSelected}
                          onChange={() => toggleRow(row)}
                        />
                      </td>
                      <td className="cell-date">{formatLocalDate(row.date)}</td>
                      <td className="cell-desc">
                        <EditableTextCell
                          value={descriptionOf(row)}
                          label={`Descrição da linha ${row.lineNumber}`}
                          edited={edits[row.externalRef]?.description !== undefined}
                          original={row.description}
                          fromMemory={
                            edits[row.externalRef]?.description === undefined &&
                            row.suggestedDescription !== null
                          }
                          onResetToOriginal={() =>
                            editRow(row.externalRef, { description: row.description })
                          }
                          onChange={(description) => editRow(row.externalRef, { description })}
                        />
                        {descriptionOf(row) !== row.description && similarCount(row) > 0 && (
                          <button
                            type="button"
                            onClick={() => applyDescriptionToSimilar(row)}
                            title={`Aplicar esta descrição às ${similarCount(row)} outras linhas deste estabelecimento`}
                            className="mt-0.5 block text-caption font-semibold text-brand-text hover:underline"
                          >
                            aplicar nome a +{similarCount(row)} iguais
                          </button>
                        )}
                        {row.duplicate && (
                          <>
                            {' '}
                            <Badge kind="muted" square dot={false}>
                              já importada
                            </Badge>
                          </>
                        )}
                        {needsInvoiceReview(row) && (
                          <>
                            {' '}
                            <span
                              title={`O valor não bate com o total da fatura ${row.invoiceLabel}. Confira e, se for o pagamento dela, troque o tipo.`}
                            >
                              <Badge kind="pending" square dot={false}>
                                revisar
                              </Badge>
                            </span>
                          </>
                        )}
                        {row.invoicePaymentUnmatched && !needsInvoiceReview(row) && (
                          <>
                            {' '}
                            <span title="Nenhuma fatura com vencimento perto desta data. Importe a fatura do cartão antes.">
                              <Badge kind="pending" square dot={false}>
                                sem fatura
                              </Badge>
                            </span>
                          </>
                        )}
                        {row.unknownHistory && (
                          <>
                            {' '}
                            <Badge kind="pending" square dot={false}>
                              revisar
                            </Badge>
                          </>
                        )}
                      </td>
                      <td className="cell-hist font-mono text-caption text-fg-subtle">
                        {row.rawHistory}
                      </td>
                      <td className="cell-type">
                        <EditableTypeCell
                          label={`Tipo da linha ${row.lineNumber}`}
                          type={typeOf(row)}
                          typeOptions={typeOptionsOf(row)}
                          detail={detailOf(row)}
                          target={targetOf(row)}
                          onTypeChange={(type) => editRow(row.externalRef, { type })}
                        />
                      </td>
                      <td className="cell-method">
                        {PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod}
                      </td>
                      <td className="cell-cat">
                        {MOVEMENT_TYPES.includes(typeOf(row)) ? (
                          <span className="text-fg-subtle">—</span>
                        ) : (
                          <>
                            <EditableCategoryCell
                              value={categoryIdOf(row)}
                              label={`Categoria da linha ${row.lineNumber}`}
                              categories={categories}
                              fallbackName={
                                categoryIdOf(row) === row.suggestedCategoryId
                                  ? row.suggestedCategoryName
                                  : null
                              }
                              suggestionSource={row.suggestionSource}
                              reviewed={'categoryId' in (edits[row.externalRef] ?? {})}
                              onChange={(categoryId) => editRow(row.externalRef, { categoryId })}
                            />
                            {categoryIdOf(row) !== null && similarCount(row) > 0 && (
                              <button
                                type="button"
                                onClick={() => applyCategoryToSimilar(row)}
                                title={`Aplicar esta categoria às ${similarCount(row)} outras linhas deste estabelecimento`}
                                className="mt-0.5 block text-caption font-semibold text-brand-text hover:underline"
                              >
                                aplicar a +{similarCount(row)} iguais
                              </button>
                            )}
                          </>
                        )}
                      </td>
                      <td
                        className={`num cell-amount whitespace-nowrap ${
                          row.outgoing ? 'text-fg' : 'text-income'
                        }`}
                      >
                        <Money
                          value={
                            row.outgoing
                              ? -Math.abs(Number(row.amount))
                              : Math.abs(Number(row.amount))
                          }
                          signed
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="Conta de destino" required>
            <Select
              aria-label="Conta de destino"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">Selecionar conta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Formato do extrato" required>
            <Select
              aria-label="Formato do extrato"
              value={format}
              onChange={(e) => setFormat(e.target.value as StatementFormat)}
            >
              {STATEMENT_FORMATS.map((value) => (
                <option key={value} value={value}>
                  {STATEMENT_FORMAT_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Arquivo"
            required
            hint="Exporte o extrato da conta corrente em CSV pelo app do banco."
          >
            <FilePicker
              ref={fileInputRef}
              accept=".csv,text/csv"
              aria-label="Arquivo"
              file={file}
              onFileChange={setFile}
              placeholder="Selecionar CSV do extrato"
            />
          </Field>

          <div className="flex items-start gap-2 rounded-lg bg-info-soft px-3.5 py-2.5 text-body-sm text-fg">
            <Info size={16} className="mt-px shrink-0 text-info" aria-hidden="true" />
            <span>
              Nada é gravado nesta etapa. Você vai conferir os lançamentos classificados antes de
              confirmar, e os que já tiverem sido importados nesta conta virão desmarcados.
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-body-sm text-fg-muted">
            <span>
              Só um Pix?{' '}
              <button
                type="button"
                onClick={() => void navigate(ROUTES.SHARE_TARGET)}
                className={LINK_CLASS}
              >
                Lançar comprovante Pix
              </button>{' '}
              (imagem ou PDF do app do banco).
            </span>
            {onReconcile && (
              <span>
                Importou extratos ou faturas antes? Pagamentos de fatura como despesa, aplicações e
                parcelamentos partidos podem ser corrigidos em{' '}
                <button type="button" onClick={onReconcile} className={LINK_CLASS}>
                  Corrigir importações antigas
                </button>
                .
              </span>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
