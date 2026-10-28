import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TRANSACTION_FILTER_TYPES,
  TRANSACTION_FILTER_STATUSES,
} from '@/features/transactions/schemas'
import { TRANSACTION_STATUS_LABELS } from '@/features/transactions/utils/transaction-status'
import { PaymentMethodSelect } from '@/features/transactions/components/payment-method-select'
import {
  currentPeriod,
  periodLabel,
  serializePeriod,
  shiftPeriod,
  type TransactionPeriod,
} from '@/features/transactions/utils/period'
import type { Account } from '@/features/accounts/types'
import type { Category } from '@/features/categories/types'
import type {
  ListTransactionsParams,
  TransactionType,
  TransactionStatus,
  PaymentMethodSlug,
} from '@/features/transactions/types'

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  REFUND: 'Reembolso',
  TRANSFER: 'Transferência',
  MANUAL_ADJUSTMENT: 'Ajuste',
  INVOICE_PAYMENT: 'Pagamento de fatura',
}

interface TransactionFilterPanelProps {
  filters: ListTransactionsParams
  accounts: Account[]
  /** Lista achatada (raízes + subcategorias) — ver `flattenCategories`. */
  categories: Category[]
  includeCancelled: boolean
  period: TransactionPeriod
  onPeriodChange: (period: TransactionPeriod) => void
  onFiltersChange: (filters: ListTransactionsParams) => void
  /** Busca já com debounce; quem chama deve preservar os demais filtros vigentes. */
  onSearchChange: (searchText: string | undefined) => void
  onReset: () => void
  onToggleIncludeCancelled: () => void
}

export function TransactionFilterPanel({
  filters,
  accounts,
  categories,
  includeCancelled,
  period,
  onPeriodChange,
  onFiltersChange,
  onSearchChange,
  onReset,
  onToggleIncludeCancelled,
}: TransactionFilterPanelProps) {
  function update(patch: Partial<ListTransactionsParams>) {
    onFiltersChange({ ...filters, ...patch, page: 0 })
  }

  // A busca tem estado próprio: gravar na URL a cada tecla disparava uma request por letra e,
  // com a resposta chegando fora de ordem, o campo voltava a um valor antigo e perdia letras.
  const appliedSearch = filters.searchText ?? ''
  const [search, setSearch] = useState(appliedSearch)
  const [sentSearch, setSentSearch] = useState(appliedSearch)
  // Mudança vinda de fora (limpar filtros, voltar no histórico) sobrescreve o campo; o eco
  // do que este campo mesmo enviou não, senão as letras digitadas depois se perdem.
  if (appliedSearch !== sentSearch) {
    setSentSearch(appliedSearch)
    setSearch(appliedSearch)
  }

  useEffect(() => {
    if (search === sentSearch) return
    const timer = setTimeout(() => {
      setSentSearch(search)
      onSearchChange(search.trim() ? search : undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, sentSearch, onSearchChange])

  const isCurrentMonth = serializePeriod(period) === serializePeriod(currentPeriod())

  return (
    <div className="filterbar" role="search" aria-label="Filtrar transações">
      <div className="period" role="group" aria-label="Período">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Mês anterior"
          disabled={period.kind === 'all'}
          onClick={() => onPeriodChange(shiftPeriod(period, -1))}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="period-label" aria-live="polite">
          {periodLabel(period)}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Próximo mês"
          disabled={period.kind === 'all'}
          onClick={() => onPeriodChange(shiftPeriod(period, 1))}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
      <button
        type="button"
        className={period.kind === 'all' ? 'chip on' : 'chip'}
        aria-pressed={period.kind === 'all'}
        onClick={() => onPeriodChange(period.kind === 'all' ? currentPeriod() : { kind: 'all' })}
      >
        Todo o período
      </button>
      {period.kind === 'month' && !isCurrentMonth && (
        <button type="button" className="chip" onClick={() => onPeriodChange(currentPeriod())}>
          Mês atual
        </button>
      )}

      <div className="search">
        <Search size={13} className="ico" />
        <input
          placeholder="Buscar por descrição…"
          aria-label="Buscar por descrição"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <select
        className="chip"
        aria-label="Filtrar por tipo"
        value={filters.type ?? ''}
        onChange={(e) => update({ type: (e.target.value as TransactionType) || undefined })}
      >
        <option value="">Tipo</option>
        {TRANSACTION_FILTER_TYPES.map((t) => (
          <option key={t} value={t}>
            {TRANSACTION_TYPE_LABELS[t]}
          </option>
        ))}
      </select>

      <select
        className="chip"
        aria-label="Filtrar por status"
        value={filters.status ?? ''}
        onChange={(e) => update({ status: (e.target.value as TransactionStatus) || undefined })}
      >
        <option value="">Status</option>
        {TRANSACTION_FILTER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {TRANSACTION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        className="chip"
        aria-label="Filtrar por conta"
        value={filters.accountId ?? ''}
        onChange={(e) => update({ accountId: e.target.value || undefined })}
      >
        <option value="">Conta</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <select
        className="chip"
        aria-label="Filtrar por categoria"
        value={filters.categoryId ?? ''}
        onChange={(e) => update({ categoryId: e.target.value || undefined })}
      >
        <option value="">Categoria</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.parentId ? '↳ ' : ''}
            {c.name}
          </option>
        ))}
      </select>

      <PaymentMethodSelect
        aria-label="Filtrar por forma de pagamento"
        value={filters.paymentMethod ?? ''}
        onChange={(value) => update({ paymentMethod: (value as PaymentMethodSlug) || undefined })}
        allowAll="Todas as formas"
        className={filters.paymentMethod ? 'chip on' : 'chip'}
      />

      <div style={{ flex: 1 }} />

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--text-muted)',
          padding: '0 8px',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          className="checkbox"
          checked={includeCancelled}
          onChange={onToggleIncludeCancelled}
        />
        Incluir cancelados
      </label>

      <Button type="button" size="sm" variant="ghost" onClick={onReset}>
        Limpar filtros
      </Button>
    </div>
  )
}
