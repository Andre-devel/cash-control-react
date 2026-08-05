import { useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/money'
import { TypeBadge } from '@/components/ui/type-badge'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import {
  EditableCategoryCell,
  EditableTextCell,
} from '@/features/transactions/components/import-editable-cell'
import { useStatementImportPreview } from '@/features/transactions/hooks/use-statement-import-preview'
import { useCommitStatementImport } from '@/features/transactions/hooks/use-commit-statement-import'
import {
  STATEMENT_FORMATS,
  STATEMENT_FORMAT_LABELS,
  type ImportPreviewResponse,
  type ImportPreviewRow,
  type StatementFormat,
} from '@/features/transactions/types'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  PIX: 'Pix',
  DEBIT_CARD: 'Cartão de débito',
  CREDIT_CARD: 'Cartão de crédito',
  BANK_TRANSFER: 'Transferência',
  BOLETO: 'Boleto',
  OTHER: 'Outros',
}

function fmtDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

interface RowEdit {
  description?: string
  categoryId?: string | null
}

/** Duas linhas são "iguais" quando o banco descreveu o mesmo estabelecimento. */
function descriptionKey(description: string): string {
  return description.trim().toLowerCase()
}

interface ImportStatementDialogProps {
  open: boolean
  onClose: () => void
}

export function ImportStatementDialog({ open, onClose }: ImportStatementDialogProps) {
  const { data: allAccounts = [] } = useAccounts()
  const accounts = useMemo(() => allAccounts.filter((a) => !a.archivedAt), [allAccounts])
  const { data: categories = [] } = useCategories()
  const flatCategories = useMemo(() => flattenCategories(categories), [categories])

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

  const { mutate: analyze, isPending: isAnalyzing } = useStatementImportPreview()
  const { mutate: commit, isPending: isImporting } = useCommitStatementImport()

  function reset() {
    setAccountId('')
    setFormat('INTER_CSV')
    setFile(null)
    setPreview(null)
    setSelected(new Set())
    setEdits({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function descriptionOf(row: ImportPreviewRow): string {
    return edits[row.externalRef]?.description ?? row.description
  }

  function categoryIdOf(row: ImportPreviewRow): string | null {
    const edit = edits[row.externalRef]
    return edit && 'categoryId' in edit ? (edit.categoryId ?? null) : row.suggestedCategoryId
  }

  function editRow(externalRef: string, patch: RowEdit) {
    setEdits((current) => ({ ...current, [externalRef]: { ...current[externalRef], ...patch } }))
  }

  /**
   * Aplica a categoria a todas as linhas que o banco descreveu igual — o mesmo mercado
   * costuma aparecer dezenas de vezes num extrato de dois anos, e classificar uma a uma
   * seria trabalho manual demais para o recurso valer a pena.
   */
  function applyCategoryToSimilar(row: ImportPreviewRow) {
    if (!preview) return
    const categoryId = categoryIdOf(row)
    const key = descriptionKey(row.description)
    setEdits((current) => {
      const next = { ...current }
      for (const other of preview.rows) {
        if (descriptionKey(other.description) === key) {
          next[other.externalRef] = { ...next[other.externalRef], categoryId }
        }
      }
      return next
    })
  }

  /** Quantas outras linhas o banco descreveu igual a esta. */
  function similarCount(row: ImportPreviewRow): number {
    if (!preview) return 0
    const key = descriptionKey(row.description)
    return preview.rows.filter((other) => descriptionKey(other.description) === key).length - 1
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

  function toggleAll() {
    if (!preview) return
    const importable = preview.rows.filter((row) => !row.duplicate)
    const allSelected = importable.every((row) => selected.has(row.externalRef))
    setSelected(allSelected ? new Set() : new Set(importable.map((row) => row.externalRef)))
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
        amount: row.amount,
        type: row.type,
        paymentMethod: row.paymentMethod,
        categoryId: categoryIdOf(row) ?? undefined,
      }))

    commit({ accountId, format, rows }, { onSuccess: handleClose })
  }

  if (!open) return null

  const selectedCount = selected.size
  const subtitle = preview
    ? `${preview.totalRows} lançamentos lidos · ${preview.duplicateCount} já importados · ${preview.warningCount} para revisar`
    : 'Envie o arquivo do extrato para conferir os lançamentos antes de gravar'

  return (
    <Modal
      title="Importar extrato"
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
        <div className="col gap-4">
          {preview.sourceAccountLabel && (
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Conta no extrato: <strong>{preview.sourceAccountLabel}</strong>
              {preview.periodStart && preview.periodEnd && (
                <>
                  {' · '}Período de {fmtDate(preview.periodStart)} a {fmtDate(preview.periodEnd)}
                </>
              )}
            </div>
          )}

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

          <div className="tbl-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 36, paddingLeft: 16 }}>
                    <input
                      type="checkbox"
                      aria-label="Selecionar todos"
                      checked={selectedCount > 0 && selectedCount === preview.importableCount}
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
                      style={row.duplicate ? { opacity: 0.55 } : undefined}
                      data-testid={`import-row-${row.lineNumber}`}
                    >
                      <td style={{ paddingLeft: 16 }}>
                        <input
                          type="checkbox"
                          aria-label={`Importar ${descriptionOf(row)}`}
                          checked={isSelected}
                          onChange={() => toggleRow(row)}
                        />
                      </td>
                      <td>{fmtDate(row.date)}</td>
                      <td>
                        <EditableTextCell
                          value={descriptionOf(row)}
                          label={`Descrição da linha ${row.lineNumber}`}
                          edited={edits[row.externalRef]?.description !== undefined}
                          onChange={(description) => editRow(row.externalRef, { description })}
                        />
                        {row.duplicate && (
                          <>
                            {' '}
                            <Badge kind="muted" square dot={false}>
                              já importada
                            </Badge>
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
                      <td style={{ color: 'var(--text-dim)' }}>{row.rawHistory}</td>
                      <td>
                        <TypeBadge type={row.type} />
                      </td>
                      <td>{PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod}</td>
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
                          onChange={(categoryId) => editRow(row.externalRef, { categoryId })}
                        />
                        {categoryIdOf(row) !== null && similarCount(row) > 0 && (
                          <button
                            type="button"
                            onClick={() => applyCategoryToSimilar(row)}
                            title={`Aplicar esta categoria às ${similarCount(row)} outras linhas com a mesma descrição`}
                            style={{
                              display: 'block',
                              background: 'none',
                              border: 0,
                              padding: 0,
                              marginTop: 2,
                              color: 'var(--accent)',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            aplicar a +{similarCount(row)} iguais
                          </button>
                        )}
                      </td>
                      <td className="num">
                        <Money value={Number(row.amount)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="col gap-4">
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              aria-label="Arquivo"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
              Nada é gravado nesta etapa. Você vai conferir os lançamentos classificados antes de
              confirmar, e os que já tiverem sido importados nesta conta virão desmarcados.
            </span>
          </div>
        </div>
      )}
    </Modal>
  )
}
