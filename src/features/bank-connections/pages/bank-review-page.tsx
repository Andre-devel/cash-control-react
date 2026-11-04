import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import { useCategorizationRuleOffer } from '@/features/categories/hooks/use-categorization-rule-offer'
import { CreateRuleDialog } from '@/features/categories/components/categorization-rules-section'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import {
  BANK_PENDING_QUERY_KEY,
  useBankPending,
  useConfirmAllBankPending,
  useConfirmBankPending,
  useDiscardBankPending,
} from '@/features/bank-connections/hooks/use-bank-pending'
import { TRANSACTION_TYPE_DISPLAY } from '@/features/transactions/utils/transaction-type'
import {
  counterpartyDocumentLabel,
  counterpartyLabel,
} from '@/features/transactions/utils/transaction-display'
import { formatLocalDate } from '@/lib/format-date'
import { formatMoney } from '@/lib/money'
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

/** De onde veio o lançamento: a conta corrente ou o cartão vinculado. */
function originOf(item: BankPendingItem): { key: string; label: string } {
  if (item.creditCardId) {
    return { key: `card:${item.creditCardId}`, label: `Cartão ${item.creditCardName ?? ''}`.trim() }
  }
  return { key: `account:${item.accountId ?? ''}`, label: item.accountName ?? 'Conta' }
}

/** O que a confirmação faz com a compra parcelada no cartão. */
function installmentLabel(item: BankPendingItem): string | null {
  const { installmentNumber: number, totalInstallments: total } = item
  if (!item.creditCardId || !total || total < 2) return null
  if (number && number > 1) return `parcela ${number}/${total}`
  return `${total}x de ${formatMoney(item.row.amount)} · cria o parcelamento ao confirmar`
}

/** Mantém a ordem da fila e junta os itens da mesma origem, na ordem em que a origem aparece. */
function groupByOrigin(items: BankPendingItem[]): BankPendingItem[] {
  const groups = new Map<string, BankPendingItem[]>()
  for (const item of items) {
    const { key } = originOf(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups.values()].flat()
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
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()
  const { data: allAccounts = [] } = useAccounts()
  const accounts = useMemo(() => allAccounts.filter((a) => !a.archivedAt), [allAccounts])
  // Mora na página, e não no cartão: o cartão sai da tela assim que a linha é confirmada.
  const ruleOffer = useCategorizationRuleOffer(categories)

  /** Confirmada com outra categoria que não a sugerida: oferece a regra para as próximas. */
  function handleConfirmed(item: BankPendingItem, categoryId: string | null) {
    const { row } = item
    if (categoryId === row.suggestedCategoryId) return
    ruleOffer.offer({
      description: row.description,
      counterpartyName: row.counterpartyName,
      categoryId,
      accountId: item.accountId,
      suggestedByRule: row.suggestionSource === 'RULE',
    })
  }

  // Pular só muda a ordem: o pulado volta no fim da fila.
  // A ordem dos grupos vem da fila inteira, para pular não trocar a origem de lugar.
  const grouped = groupByOrigin(items)
  const queue = [
    ...grouped.filter((item) => !skipped.includes(item.id)),
    ...grouped.filter((item) => skipped.includes(item.id)),
  ]
  const current = queue[0]
  const origins = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>()
    for (const item of items) {
      const { key, label } = originOf(item)
      counts.set(key, { label, count: (counts.get(key)?.count ?? 0) + 1 })
    }
    return [...counts.entries()].map(([key, value]) => ({ key, ...value }))
  }, [items])

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

      {origins.length > 1 && (
        <ul className="flex flex-wrap gap-2" aria-label="Origens">
          {origins.map((origin) => (
            <li key={origin.key}>
              <Badge kind={current && originOf(current).key === origin.key ? 'info' : 'muted'}>
                {origin.label} · {origin.count}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <ReviewCard
          key={current.id}
          item={current}
          position={`1 de ${queue.length}`}
          canSkip={queue.length > 1}
          onSkip={() => setSkipped((ids) => [...ids.filter((id) => id !== current.id), current.id])}
          onConfirmed={handleConfirmed}
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

      <CreateRuleDialog
        open={ruleOffer.draft !== null}
        onClose={ruleOffer.close}
        categories={categories}
        accounts={accounts}
        initialValues={ruleOffer.draft}
        // As sugestões da fila foram calculadas antes da regra existir.
        onCreated={() => void queryClient.invalidateQueries({ queryKey: BANK_PENDING_QUERY_KEY })}
      />
    </div>
  )
}

interface ReviewCardProps {
  item: BankPendingItem
  position: string
  canSkip: boolean
  onSkip: () => void
  /** Depois de gravada, com a categoria que foi usada (`null` em transferência e fatura). */
  onConfirmed: (item: BankPendingItem, categoryId: string | null) => void
}

function ReviewCard({ item, position, canSkip, onSkip, onConfirmed }: ReviewCardProps) {
  const { row } = item
  const { data: categories = [] } = useCategories()
  const confirm = useConfirmBankPending()
  const discard = useDiscardBankPending()
  const [draft, setDraft] = useState<Draft>(() => draftOf(row))

  useEffect(() => setDraft(draftOf(row)), [row])

  // No cartão a compra vai para a fatura: só nome e categoria são editáveis.
  const card = Boolean(item.creditCardId)
  const type = card ? row.type : draft.type
  const movement = MOVEMENT_TYPES.includes(type)
  const busy = confirm.isPending || discard.isPending
  const installments = installmentLabel(item)

  function handleConfirm() {
    const categoryId = movement ? null : draft.categoryId
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
          type,
          paymentMethod: row.paymentMethod,
          categoryId,
          outgoing: row.outgoing,
          transferAccountId: type === 'TRANSFER' ? row.transferAccountId : null,
          invoiceId: type === 'INVOICE_PAYMENT' ? row.invoiceId : null,
          counterpartyName: row.counterpartyName,
          counterpartyDocument: row.counterpartyDocument,
        },
      },
      {
        onSuccess: (saved) => {
          toast.success(`Gravado: ${saved.description}`)
          onConfirmed(item, categoryId)
        },
      },
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
            {position} · {originOf(item).label} · {formatLocalDate(row.date)}
          </span>
          <span className="text-body font-semibold text-fg">
            {row.rawHistory || row.description}
          </span>
          {draft.description !== row.description && (
            <span className="text-caption text-fg-muted">{row.description}</span>
          )}
          {row.counterpartyName && (
            <span className="text-caption text-fg-muted">
              {counterpartyLabel(row.counterpartyName, row.outgoing)}
              {row.counterpartyDocument &&
                ` · ${counterpartyDocumentLabel(row.counterpartyDocument)}`}
            </span>
          )}
        </div>
        <span className="text-amount-lg tabular-nums">
          <Money value={(row.outgoing ? -1 : 1) * Number(row.amount)} signed />
        </span>
      </div>

      {installments && <span className="text-caption text-fg-muted">{installments}</span>}

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {!card && (
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
        )}
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
