import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Copy, CreditCard, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { FilePicker } from '@/components/ui/file-picker'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/money'
import { useCards } from '@/features/cards/hooks/use-cards'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useCategories } from '@/features/categories/hooks/use-categories'
import {
  EditableCategoryCell,
  EditableTextCell,
} from '@/features/transactions/components/import-editable-cell'
import { useFaturaImportPreview } from '@/features/cards/hooks/use-fatura-import-preview'
import { useFaturaImportDuplicates } from '@/features/cards/hooks/use-fatura-import-duplicates'
import { useCommitFaturaImport } from '@/features/cards/hooks/use-commit-fatura-import'
import {
  INVOICE_IMPORT_FORMATS,
  INVOICE_IMPORT_FORMAT_LABELS,
  type FaturaImportCommitRow,
  type FaturaImportGroupPreview,
  type FaturaImportPreviewResponse,
  type FaturaImportPreviewRow,
  type InvoiceImportFormat,
} from '@/features/cards/types'
import { invoiceLabel } from '@/features/cards/utils/invoice-month'
import { formatLocalDate } from '@/lib/format-date'

/** "1 de 2 · Conta e arquivo" — o mesmo indicador de passo da importação de extrato. */
function StepLabel({ step, title }: { step: 1 | 2; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-brand-soft px-2 py-1 font-mono text-[11px] font-semibold leading-none text-brand-text">
        {step} de 2
      </span>
      <span className="text-body-sm font-semibold">{title}</span>
    </div>
  )
}

const TILE_TONE = { default: 'text-fg', muted: 'text-fg-muted', brand: 'text-brand-text' } as const

function SummaryTile({
  value,
  label,
  tone = 'default',
}: {
  value: number
  label: string
  tone?: keyof typeof TILE_TONE
}) {
  return (
    <div className="flex flex-col-reverse gap-1 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd
        className={`m-0 font-display text-h2 font-bold leading-none tabular-nums ${TILE_TONE[tone]}`}
      >
        {value}
      </dd>
    </div>
  )
}

interface ImportFaturaDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Importação da fatura de cartão em PDF, em dois passos.
 *
 * <p>A diferença estrutural para o diálogo de extrato: o cartão não é escolhido antes
 * do upload. Um PDF do Inter cobre o titular e os adicionais, e só depois da leitura
 * se sabe quantos cartões existem no arquivo — por isso a prévia vem agrupada e a
 * escolha do cartão é por grupo.
 */
export function ImportFaturaDialog({ open, onClose }: ImportFaturaDialogProps) {
  const { data: allCards = [] } = useCards()
  const cards = useMemo(() => allCards.filter((card) => !card.archivedAt), [allCards])
  const { data: allAccounts = [] } = useAccounts()
  const accounts = useMemo(() => allAccounts.filter((a) => !a.archivedAt), [allAccounts])
  const { data: categories = [] } = useCategories()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [format, setFormat] = useState<InvoiceImportFormat>('INTER_FATURA_PDF')
  const [file, setFile] = useState<File | null>(null)
  /**
   * Conta em que as transações de cartão são lançadas — uma só para o arquivo inteiro,
   * mesmo quando ele traz mais de um cartão. Não sai do PDF, e a conta só volta a
   * importar quando a fatura for paga.
   */
  const [accountId, setAccountId] = useState('')
  const [preview, setPreview] = useState<FaturaImportPreviewResponse | null>(null)
  /**
   * A fatura já foi paga na vida real (importação de histórico). Quando marcado, o servidor
   * grava a fatura do mês como paga; as compras seguem pendentes e o saldo da conta não se
   * move. Só faz sentido depois da prévia, quando já se sabe qual é a fatura.
   */
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  /** Cartão escolhido por seção do PDF, indexado por `cardLast4`. */
  const [cardByGroup, setCardByGroup] = useState<Record<string, string>>({})
  /**
   * Categorias alteradas pelo usuário, por `externalRef`. Ficam fora de `preview` de
   * propósito: a prévia é o que o servidor leu do arquivo e não muda.
   */
  const [edits, setEdits] = useState<Record<string, string | null>>({})
  /** Descrições reescritas pelo usuário, também por `externalRef`. */
  const [descriptionEdits, setDescriptionEdits] = useState<Record<string, string>>({})

  const { mutate: analyze, isPending: isAnalyzing } = useFaturaImportPreview()
  const { mutate: commit, isPending: isImporting } = useCommitFaturaImport()

  /**
   * A prévia marca "já importada" olhando a fatura do cartão que ela mesma sugeriu. Quando
   * o cartão de destino é escolhido à mão, a marca da prévia é sobre outra fatura — daí a
   * consulta por grupo, refeita a cada troca de cartão.
   */
  const { byGroup: duplicatesByGroup, fetchingByGroup } = useFaturaImportDuplicates(
    preview?.groups ?? [],
    preview?.referenceMonth,
    cardByGroup,
  )

  /** A resposta do servidor manda; enquanto ela não chega, vale o que a prévia disse. */
  function isDuplicate(group: FaturaImportGroupPreview, row: FaturaImportPreviewRow): boolean {
    const checked = duplicatesByGroup[group.cardLast4]
    return checked ? checked.has(row.externalRef) : row.duplicate
  }

  /**
   * O que a seleção já reflete, por grupo. Guardado num ref para que o ajuste abaixo veja
   * só o que mudou de fato — reaplicar o conjunto inteiro apagaria as marcações e
   * desmarcações que o usuário fez à mão.
   */
  const appliedDuplicates = useRef<Record<string, Set<string>>>({})

  useEffect(() => {
    if (!preview) return

    const toSelect: string[] = []
    const toDeselect: string[] = []

    for (const group of preview.groups) {
      // Sem resposta e sem consulta em andamento, o grupo voltou a valer pela prévia —
      // é o caso de desfazer a escolha do cartão ou voltar ao que a prévia sugeriu.
      if (!duplicatesByGroup[group.cardLast4] && fetchingByGroup[group.cardLast4]) continue

      const fromPreview = new Set(
        group.rows.filter((row) => row.duplicate).map((row) => row.externalRef),
      )
      const next = duplicatesByGroup[group.cardLast4] ?? fromPreview
      const previous = appliedDuplicates.current[group.cardLast4] ?? fromPreview

      // Virou duplicata com o cartão novo: sai da seleção, como na prévia.
      for (const ref of next) if (!previous.has(ref)) toDeselect.push(ref)
      // Deixou de ser: volta marcada, que é o estado em que a prévia a entregaria.
      for (const ref of previous) if (!next.has(ref)) toSelect.push(ref)

      appliedDuplicates.current[group.cardLast4] = next
    }

    if (toSelect.length === 0 && toDeselect.length === 0) return
    setSelected((current) => {
      const updated = new Set(current)
      for (const ref of toDeselect) updated.delete(ref)
      for (const ref of toSelect) updated.add(ref)
      return updated
    })
  }, [preview, duplicatesByGroup, fetchingByGroup])

  function reset() {
    setFormat('INTER_FATURA_PDF')
    setFile(null)
    setAccountId('')
    setPreview(null)
    setAlreadyPaid(false)
    setSelected(new Set())
    setCardByGroup({})
    appliedDuplicates.current = {}
    setEdits({})
    setDescriptionEdits({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  function categoryIdOf(row: FaturaImportPreviewRow): string | null {
    return row.externalRef in edits ? edits[row.externalRef] : row.suggestedCategoryId
  }

  /**
   * O que a linha vai levar como descrição: a edição desta sessão, senão o apelido que o
   * servidor lembrou para o estabelecimento, senão o texto do arquivo.
   */
  function descriptionOf(row: FaturaImportPreviewRow): string {
    return descriptionEdits[row.externalRef] ?? row.suggestedDescription ?? row.description
  }

  /**
   * Aplica a descrição de uma linha às outras do mesmo estabelecimento, como
   * {@link applyCategoryToMerchant} faz com a categoria: renomear um estabelecimento é uma
   * decisão só, mesmo quando ele aparece cinco vezes na fatura.
   */
  function applyDescriptionToMerchant(row: FaturaImportPreviewRow) {
    if (!preview || !row.merchantKey) return
    const description = descriptionOf(row)
    const key = row.merchantKey
    setDescriptionEdits((current) => {
      const next = { ...current }
      for (const other of preview.groups.flatMap((group) => group.rows)) {
        if (other.merchantKey === key) next[other.externalRef] = description
      }
      return next
    })
  }

  /** Outras linhas da prévia — de qualquer seção — com o mesmo estabelecimento. */
  function merchantRowsOf(row: FaturaImportPreviewRow): FaturaImportPreviewRow[] {
    if (!preview || !row.merchantKey) return []
    return preview.groups
      .flatMap((group) => group.rows)
      .filter(
        (other) => other.externalRef !== row.externalRef && other.merchantKey === row.merchantKey,
      )
  }

  /**
   * Aplica a categoria escolhida numa linha a todas as outras da prévia com o mesmo
   * `merchantKey` — é aqui que revisar um estabelecimento vira uma decisão só, em vez de
   * uma por linha.
   */
  function applyCategoryToMerchant(row: FaturaImportPreviewRow) {
    if (!preview || !row.merchantKey) return
    const categoryId = categoryIdOf(row)
    const key = row.merchantKey
    setEdits((current) => {
      const next = { ...current }
      for (const other of preview.groups.flatMap((group) => group.rows)) {
        if (other.merchantKey === key) next[other.externalRef] = categoryId
      }
      return next
    })
  }

  /**
   * Linhas cuja sugestão ainda não foi confirmada pelo usuário e não veio de uma regra
   * declarada — é nelas que vale a pena olhar antes de importar. Uma regra (`RULE`) é
   * intenção do próprio usuário e não entra na lista; `HISTORY` e `NONE` sim.
   */
  function reviewRows(): FaturaImportPreviewRow[] {
    if (!preview) return []
    return preview.groups.flatMap((group) =>
      group.rows.filter((row) => row.suggestionSource !== 'RULE' && !(row.externalRef in edits)),
    )
  }

  /** Rola até a primeira linha pendente de revisão e leva o foco à sua categoria. */
  function jumpToReview() {
    const [target] = reviewRows()
    if (!target) return
    const rowEl = document.querySelector(`[data-testid="fatura-row-${target.lineNumber}"]`)
    // O jsdom não implementa scrollIntoView, e isto roda em teste também.
    if (rowEl instanceof HTMLElement && typeof rowEl.scrollIntoView === 'function') {
      rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    rowEl
      ?.querySelector<HTMLElement>(`[aria-label="Categoria da linha ${target.lineNumber}"]`)
      ?.focus()
  }

  function handleAnalyze() {
    if (!file) return
    analyze(
      { file, format },
      {
        onSuccess: (result) => {
          appliedDuplicates.current = {}
          setPreview(result)
          // Duplicatas já entraram numa importação anterior: vêm desmarcadas para que
          // confirmar sem revisar não seja um caminho para duplicar a fatura.
          setSelected(
            new Set(
              result.groups.flatMap((group) =>
                group.rows.filter((row) => !row.duplicate).map((row) => row.externalRef),
              ),
            ),
          )
          setCardByGroup(
            Object.fromEntries(
              result.groups
                .filter((group) => group.suggestedCreditCardId !== null)
                .map((group) => [group.cardLast4, group.suggestedCreditCardId as string]),
            ),
          )
        },
      },
    )
  }

  function toggleRow(row: FaturaImportPreviewRow) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(row.externalRef)) next.delete(row.externalRef)
      else next.add(row.externalRef)
      return next
    })
  }

  function toggleGroup(group: FaturaImportGroupPreview) {
    const importable = group.rows.filter((row) => !isDuplicate(group, row))
    const allSelected = importable.every((row) => selected.has(row.externalRef))
    setSelected((current) => {
      const next = new Set(current)
      for (const row of importable) {
        if (allSelected) next.delete(row.externalRef)
        else next.add(row.externalRef)
      }
      return next
    })
  }

  function selectedRowsOf(group: FaturaImportGroupPreview): FaturaImportPreviewRow[] {
    return group.rows.filter((row) => selected.has(row.externalRef))
  }

  /** Leva o foco ao seletor de cartão da seção, que pode estar fora da área visível. */
  function focusCardSelect(cardLast4: string) {
    const el = document.querySelector<HTMLElement>(`[aria-label="Cartão da seção ${cardLast4}"]`)
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    el?.focus()
  }

  /** Grupos que o usuário quer importar mas ainda não têm cartão escolhido. */
  const groupsMissingCard = preview
    ? preview.groups.filter(
        (group) => selectedRowsOf(group).length > 0 && !cardByGroup[group.cardLast4],
      )
    : []

  function handleImport() {
    if (!preview) return
    const rows: FaturaImportCommitRow[] = preview.groups.flatMap((group) =>
      // As já importadas vão junto mesmo desmarcadas: não gravam nada novo, mas é por elas
      // que o servidor corrige a parcela que nasceu por estimativa no mês anterior
      // (56,15 previstos, 56,08 cobrados) para o valor que este PDF traz.
      group.rows
        .filter(
          (row) =>
            selected.has(row.externalRef) ||
            (isDuplicate(group, row) && Boolean(cardByGroup[group.cardLast4])),
        )
        .map((row) => ({
          lineNumber: row.lineNumber,
          creditCardId: cardByGroup[group.cardLast4],
          // Os 4 dígitos vão junto porque fazem parte da identidade da linha: é deles que
          // sai a chave das parcelas futuras que o servidor gera.
          cardLast4: group.cardLast4,
          // O externalRef vai como veio do servidor: é ele, e não a descrição, que
          // identifica a linha na deduplicação.
          externalRef: row.externalRef,
          // Devolvido como veio: recontar o ordinal aqui daria outro número, porque a
          // confirmação leva só as linhas marcadas.
          ordinal: row.ordinal,
          date: row.date,
          description: descriptionOf(row),
          // A original vai junto e sem edição: é dela que o servidor deriva a chave das
          // parcelas seguintes, que precisa bater com o PDF do mês que vem.
          originalDescription: row.description,
          amount: row.amount,
          installmentNumber: row.installmentNumber,
          totalInstallments: row.totalInstallments,
          categoryId: categoryIdOf(row) ?? undefined,
          refund: row.refund,
        })),
    )

    commit(
      { format, referenceMonth: preview.referenceMonth, accountId, rows, alreadyPaid },
      { onSuccess: handleClose },
    )
  }

  if (!open) return null

  const selectedCount = selected.size
  // Compras menos estornos de todas as seções, contra o total que o PDF declara (#84).
  const readTotal = preview
    ? preview.groups
        .flatMap((group) => group.rows)
        .reduce((sum, row) => sum + (row.refund ? -1 : 1) * Number(row.amount), 0)
    : 0
  const pdfDifference = preview?.totalAmount
    ? Math.round((Number(preview.totalAmount) - readTotal) * 100) / 100
    : null
  // Recontada aqui porque a verificação do cartão escolhido à mão pode marcar mais linhas
  // depois da prévia.
  const duplicateCount = preview
    ? preview.groups.reduce(
        (total, group) => total + group.rows.filter((row) => isDuplicate(group, row)).length,
        0,
      )
    : 0
  const subtitle = preview
    ? `${preview.totalRows} lançamentos lidos · ${duplicateCount} já importados · ${preview.excludedPaymentsCount} pagamentos ignorados`
    : 'Envie o PDF da fatura para conferir os lançamentos antes de gravar'
  const reviewCount = reviewRows().length

  return (
    <Modal
      title="Importar fatura"
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
              disabled={isImporting || selectedCount === 0 || groupsMissingCard.length > 0}
              title={
                groupsMissingCard.length > 0
                  ? `Escolha o cartão da seção ${groupsMissingCard.map((g) => `****${g.cardLast4}`).join(', ')}`
                  : undefined
              }
              aria-busy={isImporting}
            >
              {isImporting ? 'Importando…' : `Importar ${selectedCount} lançamentos`}
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
        <div className="col gap-4">
          <StepLabel step={2} title="Revisar importação" />

          <div className="text-body-sm text-fg-muted">
            Fatura de <strong className="text-fg">{invoiceLabel(preview.dueDate)}</strong> · vence
            em {formatLocalDate(preview.dueDate)}
            {preview.totalAmount && (
              <>
                {' · '}total no PDF: <Money value={Number(preview.totalAmount)} />
              </>
            )}
          </div>

          <dl className="m-0 grid grid-cols-3 gap-2">
            <SummaryTile value={preview.totalRows} label="linhas" />
            <SummaryTile value={duplicateCount} label="duplicadas" tone="muted" />
            <SummaryTile value={selectedCount} label="a importar" tone="brand" />
          </dl>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-2 p-3">
            <input
              type="checkbox"
              className="checkbox mt-0.5"
              checked={alreadyPaid}
              onChange={(e) => setAlreadyPaid(e.target.checked)}
            />
            <span className="text-body-sm">
              <strong>Esta fatura já está paga</strong>
              <span className="mt-0.5 block text-caption text-fg-muted">
                Para importar um extrato antigo já quitado. A fatura entra como paga; as compras
                ficam pendentes e o saldo da conta não é alterado. As parcelas dos próximos meses
                continuam em aberto.
              </span>
            </span>
          </label>

          {preview.errors.length > 0 && (
            <div role="alert" className="err">
              {preview.errors.length} linha(s) não puderam ser lidas e ficarão de fora:{' '}
              {preview.errors
                .slice(0, 3)
                .map((error) => `linha ${error.lineNumber} (${error.message})`)
                .join('; ')}
              {preview.errors.length > 3 && '…'}
            </div>
          )}

          {groupsMissingCard.length > 0 && (
            <div role="alert" className="err">
              {groupsMissingCard.length === 1
                ? `A seção do cartão final ${groupsMissingCard[0]!.cardLast4} (adicional ou virtual) não tem cartão de destino.`
                : `As seções dos cartões finais ${groupsMissingCard.map((g) => g.cardLast4).join(', ')} não têm cartão de destino.`}{' '}
              Escolha o cartão em &quot;Cartão da seção&quot;, mais abaixo, para poder importar.{' '}
              <button
                type="button"
                onClick={() => focusCardSelect(groupsMissingCard[0]!.cardLast4)}
                className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-current underline"
              >
                Ir para a seção
              </button>
            </div>
          )}

          {pdfDifference !== null && Math.abs(pdfDifference) >= 0.01 && (
            <div
              role="note"
              className="rounded-xl border border-info/30 bg-info-soft p-3 text-body-sm text-fg"
            >
              A soma dos lançamentos lidos (<Money value={readTotal} />) difere do total do PDF em{' '}
              <Money value={pdfDifference} />. Costuma ser saldo anterior, juros, IOF ou encargos,
              que não viram lançamento; se não for o caso, confira as linhas não lidas.
            </div>
          )}

          {reviewCount > 0 && (
            <div className="flex items-center gap-2 text-body-sm">
              <span className="text-fg-muted">{reviewCount} sem categoria confirmada</span>
              <button
                type="button"
                onClick={jumpToReview}
                className="min-h-touch cursor-pointer border-0 bg-transparent px-1 font-semibold text-brand-text underline"
              >
                revisar
              </button>
            </div>
          )}

          {preview.groups.map((group) => (
            <section
              key={group.cardLast4}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-1 p-3"
            >
              <div className="flex items-center gap-2 text-body-sm font-semibold">
                <CreditCard size={16} className="text-fg-muted" aria-hidden="true" />
                Seção ****{group.cardLast4}
                <span className="font-normal text-fg-muted">
                  · {group.rows.length} {group.rows.length === 1 ? 'linha' : 'linhas'}
                </span>
              </div>
              <Field label={`Cartão da seção ****${group.cardLast4}`} required>
                <Select
                  aria-label={`Cartão da seção ${group.cardLast4}`}
                  value={cardByGroup[group.cardLast4] ?? ''}
                  onChange={(e) =>
                    setCardByGroup((current) => ({
                      ...current,
                      [group.cardLast4]: e.target.value,
                    }))
                  }
                >
                  <option value="">Selecionar cartão</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                      {card.last4Digits ? ` (****${card.last4Digits})` : ''}
                    </option>
                  ))}
                </Select>
              </Field>

              {fetchingByGroup[group.cardLast4] && (
                <div className="text-caption text-fg-muted" aria-live="polite">
                  Verificando o que já foi importado neste cartão…
                </div>
              )}

              <div
                className="tbl-wrap stack-tbl-wrap fatura-tbl-wrap"
                style={{ maxHeight: 320, overflowY: 'auto' }}
              >
                <table className="tbl stack-tbl fatura-tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 36, paddingLeft: 16 }}>
                        <input
                          type="checkbox"
                          className="checkbox"
                          aria-label={`Selecionar todos do cartão ${group.cardLast4}`}
                          checked={
                            group.rows.filter((row) => !isDuplicate(group, row)).length > 0 &&
                            group.rows
                              .filter((row) => !isDuplicate(group, row))
                              .every((row) => selected.has(row.externalRef))
                          }
                          onChange={() => toggleGroup(group)}
                        />
                      </th>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Parcela</th>
                      <th>Categoria</th>
                      <th className="num">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr
                        key={row.externalRef}
                        style={isDuplicate(group, row) ? { opacity: 0.55 } : undefined}
                        data-testid={`fatura-row-${row.lineNumber}`}
                      >
                        <td className="cell-check" style={{ paddingLeft: 16 }}>
                          <input
                            type="checkbox"
                            className="checkbox"
                            aria-label={`Importar ${row.description}`}
                            checked={selected.has(row.externalRef)}
                            onChange={() => toggleRow(row)}
                          />
                        </td>
                        <td className="cell-date">{formatLocalDate(row.date)}</td>
                        <td className="cell-desc">
                          <EditableTextCell
                            value={descriptionOf(row)}
                            label={`Descrição da linha ${row.lineNumber}`}
                            edited={row.externalRef in descriptionEdits}
                            original={row.description}
                            fromMemory={
                              !(row.externalRef in descriptionEdits) &&
                              row.suggestedDescription !== null
                            }
                            onResetToOriginal={() =>
                              setDescriptionEdits((current) => ({
                                ...current,
                                [row.externalRef]: row.description,
                              }))
                            }
                            onChange={(description) =>
                              setDescriptionEdits((current) => ({
                                ...current,
                                [row.externalRef]: description,
                              }))
                            }
                          />
                          {descriptionOf(row) !== row.description &&
                            merchantRowsOf(row).length > 0 && (
                              <button
                                type="button"
                                onClick={() => applyDescriptionToMerchant(row)}
                                title={`Aplicar esta descrição às ${merchantRowsOf(row).length} outras linhas deste estabelecimento`}
                                className="mt-0.5 block cursor-pointer border-0 bg-transparent p-0 text-[11px] font-semibold text-brand-text"
                              >
                                aplicar nome a +{merchantRowsOf(row).length} do estabelecimento
                              </button>
                            )}
                          {row.refund && (
                            <>
                              {' '}
                              <Badge kind="income" icon={<Undo2 aria-hidden="true" />}>
                                estorno
                              </Badge>
                            </>
                          )}
                          {isDuplicate(group, row) && (
                            <>
                              {' '}
                              <Badge kind="muted" icon={<Copy aria-hidden="true" />}>
                                já importada
                              </Badge>
                            </>
                          )}
                        </td>
                        <td className="cell-meta text-fg-muted">
                          {!row.refund && row.installmentNumber && row.totalInstallments ? (
                            <span className="rounded-[6px] bg-surface-3 px-1.5 py-[3px] font-mono text-[11px] text-fg">
                              {`${row.installmentNumber}/${row.totalInstallments}`}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="cell-cat">
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
                            reviewed={row.externalRef in edits}
                            onChange={(categoryId) =>
                              setEdits((current) => ({ ...current, [row.externalRef]: categoryId }))
                            }
                          />
                          {categoryIdOf(row) !== null && merchantRowsOf(row).length > 0 && (
                            <button
                              type="button"
                              onClick={() => applyCategoryToMerchant(row)}
                              title={`Aplicar esta categoria às ${merchantRowsOf(row).length} outras linhas deste estabelecimento`}
                              className="mt-0.5 block cursor-pointer border-0 bg-transparent p-0 text-[11px] font-semibold text-brand-text"
                            >
                              aplicar a +{merchantRowsOf(row).length} do estabelecimento
                            </button>
                          )}
                        </td>
                        <td
                          className="num cell-amount"
                          style={row.refund ? { color: 'rgb(var(--cc-income))' } : undefined}
                        >
                          {/* Estorno abate a fatura: aparece com sinal, em verde. */}
                          <Money value={row.refund ? -Number(row.amount) : Number(row.amount)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="col gap-4">
          <StepLabel step={1} title="Conta e arquivo" />

          <Field
            label="Conta dos lançamentos"
            required
            hint="Onde as compras entram como transações pendentes de cartão. Só sai dessa conta quando você pagar a fatura."
          >
            <Select
              aria-label="Conta dos lançamentos"
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

          <Field label="Formato da fatura" required>
            <Select
              aria-label="Formato da fatura"
              value={format}
              onChange={(e) => setFormat(e.target.value as InvoiceImportFormat)}
            >
              {INVOICE_IMPORT_FORMATS.map((value) => (
                <option key={value} value={value}>
                  {INVOICE_IMPORT_FORMAT_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Arquivo"
            required
            hint="Baixe o PDF da fatura pelo app do banco. Um mesmo PDF pode cobrir o cartão titular e os adicionais."
          >
            <FilePicker
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              aria-label="Arquivo"
              file={file}
              onFileChange={setFile}
              placeholder="Selecionar PDF da fatura"
            />
          </Field>

          <div className="flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-caption text-fg-muted">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Nada é gravado nesta etapa. Você vai conferir os lançamentos de cada cartão antes de
              confirmar, os pagamentos da fatura são descartados e os que já tiverem sido importados
              virão desmarcados. Uma compra parcelada gera também as parcelas seguintes, nas faturas
              dos próximos meses; as anteriores a esta fatura não são criadas.
            </span>
          </div>
        </div>
      )}
    </Modal>
  )
}
