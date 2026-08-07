import { useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
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
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import {
  EditableCategoryCell,
  EditableTextCell,
} from '@/features/transactions/components/import-editable-cell'
import { useFaturaImportPreview } from '@/features/cards/hooks/use-fatura-import-preview'
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

function fmtDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
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
  const flatCategories = useMemo(() => flattenCategories(categories), [categories])

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

  function reset() {
    setFormat('INTER_FATURA_PDF')
    setFile(null)
    setAccountId('')
    setPreview(null)
    setSelected(new Set())
    setCardByGroup({})
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

  function descriptionOf(row: FaturaImportPreviewRow): string {
    return descriptionEdits[row.externalRef] ?? row.description
  }

  function handleAnalyze() {
    if (!file) return
    analyze(
      { file, format },
      {
        onSuccess: (result) => {
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
    const importable = group.rows.filter((row) => !row.duplicate)
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

  /** Grupos que o usuário quer importar mas ainda não têm cartão escolhido. */
  const groupsMissingCard = preview
    ? preview.groups.filter(
        (group) => selectedRowsOf(group).length > 0 && !cardByGroup[group.cardLast4],
      )
    : []

  function handleImport() {
    if (!preview) return
    const rows: FaturaImportCommitRow[] = preview.groups.flatMap((group) =>
      selectedRowsOf(group).map((row) => ({
        lineNumber: row.lineNumber,
        creditCardId: cardByGroup[group.cardLast4],
        // Os 4 dígitos vão junto porque fazem parte da identidade da linha: é deles que
        // sai a chave das parcelas futuras que o servidor gera.
        cardLast4: group.cardLast4,
        // O externalRef vai como veio do servidor: é ele, e não a descrição, que
        // identifica a linha na deduplicação.
        externalRef: row.externalRef,
        date: row.date,
        description: descriptionOf(row),
        // A original vai junto e sem edição: é dela que o servidor deriva a chave das
        // parcelas seguintes, que precisa bater com o PDF do mês que vem.
        originalDescription: row.description,
        amount: row.amount,
        installmentNumber: row.installmentNumber,
        totalInstallments: row.totalInstallments,
        categoryId: categoryIdOf(row) ?? undefined,
      })),
    )

    commit(
      { format, referenceMonth: preview.referenceMonth, accountId, rows },
      { onSuccess: handleClose },
    )
  }

  if (!open) return null

  const selectedCount = selected.size
  const subtitle = preview
    ? `${preview.totalRows} lançamentos lidos · ${preview.duplicateCount} já importados · ${preview.excludedPaymentsCount} pagamentos ignorados`
    : 'Envie o PDF da fatura para conferir os lançamentos antes de gravar'

  return (
    <Modal
      title="Importar fatura"
      subtitle={subtitle}
      onClose={handleClose}
      wide
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
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            Fatura de <strong>{preview.referenceMonth}</strong> · vence em{' '}
            {fmtDate(preview.dueDate)}
            {preview.totalAmount && (
              <>
                {' · '}total no PDF: <Money value={Number(preview.totalAmount)} />
              </>
            )}
          </div>

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
              Escolha o cartão de destino de cada seção antes de importar.
            </div>
          )}

          {preview.groups.map((group) => (
            <div key={group.cardLast4} className="col gap-2">
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

              <div className="tbl-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 36, paddingLeft: 16 }}>
                        <input
                          type="checkbox"
                          aria-label={`Selecionar todos do cartão ${group.cardLast4}`}
                          checked={
                            group.rows.filter((row) => !row.duplicate).length > 0 &&
                            group.rows
                              .filter((row) => !row.duplicate)
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
                        style={row.duplicate ? { opacity: 0.55 } : undefined}
                        data-testid={`fatura-row-${row.lineNumber}`}
                      >
                        <td style={{ paddingLeft: 16 }}>
                          <input
                            type="checkbox"
                            aria-label={`Importar ${row.description}`}
                            checked={selected.has(row.externalRef)}
                            onChange={() => toggleRow(row)}
                          />
                        </td>
                        <td>{fmtDate(row.date)}</td>
                        <td>
                          <EditableTextCell
                            value={descriptionOf(row)}
                            label={`Descrição da linha ${row.lineNumber}`}
                            edited={row.externalRef in descriptionEdits}
                            onChange={(description) =>
                              setDescriptionEdits((current) => ({
                                ...current,
                                [row.externalRef]: description,
                              }))
                            }
                          />
                          {row.duplicate && (
                            <>
                              {' '}
                              <Badge kind="muted" square dot={false}>
                                já importada
                              </Badge>
                            </>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-dim)' }}>
                          {row.installmentNumber && row.totalInstallments
                            ? `${row.installmentNumber}/${row.totalInstallments}`
                            : '—'}
                        </td>
                        <td>
                          <EditableCategoryCell
                            value={categoryIdOf(row)}
                            label={`Categoria da linha ${row.lineNumber}`}
                            categories={flatCategories}
                            fallbackName={
                              categoryIdOf(row) === row.suggestedCategoryId
                                ? row.suggestedCategoryName
                                : null
                            }
                            onChange={(categoryId) =>
                              setEdits((current) => ({ ...current, [row.externalRef]: categoryId }))
                            }
                          />
                        </td>
                        <td className="num">
                          <Money value={Number(row.amount)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="col gap-4">
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

          <div
            style={{
              display: 'flex',
              gap: 8,
              fontSize: 12,
              color: 'var(--text-dim)',
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
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
