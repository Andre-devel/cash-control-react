import { useEffect, useState } from 'react'
import { Check, CheckCheck, Inbox, SkipForward, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Money } from '@/components/ui/money'
import { Select } from '@/components/ui/select'
import { CategoryCombobox } from '@/features/categories/components/category-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import {
  useBankPending,
  useConfirmAllBankPending,
  useConfirmBankPending,
  useDiscardBankPending,
} from '@/features/bank-connections/hooks/use-bank-pending'
import { TRANSACTION_TYPE_DISPLAY } from '@/features/transactions/utils/transaction-type'
import { formatLocalDate } from '@/lib/format-date'
import { toast } from '@/lib/toast'
import type { BankPendingItem } from '@/features/bank-connections/types'
import type { ImportPreviewRow, TransactionType } from '@/features/transactions/types'

const CARD = 'rounded-xl border border-border bg-surface-1 shadow-1'
const MOVEMENT_TYPES: TransactionType[] = ['TRANSFER', 'INVOICE_PAYMENT']

/**
 * Tipos possíveis para a linha. Transferência e pagamento de fatura só quando a fila já os
 * sugeriu, porque é a sugestão que traz o outro lado (conta ou fatura).
 */
function typeOptionsOf(row: ImportPreviewRow): TransactionType[] {
  const base: TransactionType[] = row.outgoing ? ['EXPENSE'] : ['INCOME', 'REFUND']
  return base.includes(row.type) ? base : [row.type, ...base]
}

interface Draft {
  description: string
  categoryId: string | null
  type: TransactionType
}

function draftOf(row: ImportPreviewRow): Draft {
  return {
    description: row.suggestedDescription ?? row.description,
    categoryId: row.suggestedCategoryId,
    type: row.type,
  }
}

/** Fila de lançamentos que o banco avisou: um por vez, para confirmar em segundos. */
export default function BankReviewPage() {
  const { data: items = [], isLoading } = useBankPending()
  const confirmAll = useConfirmAllBankPending()
  const [skipped, setSkipped] = useState<string[]>([])

  // Pular só muda a ordem: o pulado volta no fim da fila.
  const queue = [
    ...items.filter((item) => !skipped.includes(item.id)),
    ...items.filter((item) => skipped.includes(item.id)),
  ]
  const current = queue[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="page-h !mb-0">
        <div>
          <h1 className="title">Revisar lançamentos</h1>
          <div className="desc">
            {isLoading
              ? 'Carregando…'
              : items.length === 0
                ? 'Nada para revisar'
                : `${items.length} ${items.length === 1 ? 'lançamento' : 'lançamentos'} do banco`}
          </div>
        </div>
      </div>

      {!isLoading && !current && (
        <EmptyState
          icon={Inbox}
          title="Tudo revisado"
          desc="Quando o banco avisar de um lançamento novo, ele aparece aqui."
        />
      )}

      {current && (
        <ReviewCard
          key={current.id}
          item={current}
          position={`1 de ${queue.length}`}
          canSkip={queue.length > 1}
          onSkip={() => setSkipped((ids) => [...ids.filter((id) => id !== current.id), current.id])}
        />
      )}

      {items.length > 1 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            loading={confirmAll.isPending}
            leading={<CheckCheck size={16} aria-hidden="true" />}
            onClick={() => confirmAll.mutate()}
          >
            Confirmar todos como sugerido
          </Button>
        </div>
      )}
    </div>
  )
}

interface ReviewCardProps {
  item: BankPendingItem
  position: string
  canSkip: boolean
  onSkip: () => void
}

function ReviewCard({ item, position, canSkip, onSkip }: ReviewCardProps) {
  const { row } = item
  const { data: categories = [] } = useCategories()
  const confirm = useConfirmBankPending()
  const discard = useDiscardBankPending()
  const [draft, setDraft] = useState<Draft>(() => draftOf(row))

  useEffect(() => setDraft(draftOf(row)), [row])

  const movement = MOVEMENT_TYPES.includes(draft.type)
  const busy = confirm.isPending || discard.isPending

  function handleConfirm() {
    confirm.mutate(
      {
        id: item.id,
        edits: {
          lineNumber: row.lineNumber,
          externalRef: row.externalRef,
          date: row.date,
          description: draft.description.trim() || row.description,
          originalDescription: row.description,
          amount: row.amount,
          type: draft.type,
          paymentMethod: row.paymentMethod,
          categoryId: movement ? null : draft.categoryId,
          outgoing: row.outgoing,
          transferAccountId: draft.type === 'TRANSFER' ? row.transferAccountId : null,
          invoiceId: draft.type === 'INVOICE_PAYMENT' ? row.invoiceId : null,
        },
      },
      { onSuccess: (saved) => toast.success(`Gravado: ${saved.description}`) },
    )
  }

  return (
    <section
      className={`${CARD} flex flex-col gap-4 p-4 md:max-w-xl`}
      aria-label="Lançamento a revisar"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-caption text-fg-muted">
            {position} · {item.accountName} · {formatLocalDate(row.date)}
          </span>
          <span className="text-body font-semibold text-fg">
            {row.rawHistory || row.description}
          </span>
          {draft.description !== row.description && (
            <span className="text-caption text-fg-muted">{row.description}</span>
          )}
        </div>
        <span className="text-amount-lg tabular-nums">
          <Money value={(row.outgoing ? -1 : 1) * Number(row.amount)} signed />
        </span>
      </div>

      {row.possibleDuplicate && (
        <Badge kind="pending">Pode já estar lançado: mesma data e valor</Badge>
      )}

      <Field label="Nome">
        <Input
          value={draft.description}
          maxLength={255}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo">
          <Select
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as TransactionType }))}
          >
            {typeOptionsOf(row).map((type) => (
              <option key={type} value={type}>
                {TRANSACTION_TYPE_DISPLAY[type].label}
                {type === 'TRANSFER' && row.transferAccountName
                  ? ` · ${row.transferAccountName}`
                  : ''}
                {type === 'INVOICE_PAYMENT' && row.invoiceLabel ? ` · ${row.invoiceLabel}` : ''}
              </option>
            ))}
          </Select>
        </Field>
        {!movement && (
          <Field label="Categoria">
            <CategoryCombobox
              value={draft.categoryId}
              categories={categories}
              fallbackName={
                draft.categoryId === row.suggestedCategoryId ? row.suggestedCategoryName : null
              }
              onChange={(categoryId) => setDraft((d) => ({ ...d, categoryId }))}
            />
          </Field>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          loading={confirm.isPending}
          disabled={busy}
          leading={<Check size={16} aria-hidden="true" />}
          onClick={handleConfirm}
        >
          Confirmar e próximo
        </Button>
        {canSkip && (
          <Button
            variant="ghost"
            disabled={busy}
            leading={<SkipForward size={16} aria-hidden="true" />}
            onClick={onSkip}
          >
            Pular
          </Button>
        )}
        <div className="spacer" />
        <Button
          variant="ghost"
          loading={discard.isPending}
          disabled={busy}
          leading={<Trash2 size={16} aria-hidden="true" />}
          onClick={() => discard.mutate(item.id)}
        >
          Descartar
        </Button>
      </div>
    </section>
  )
}
