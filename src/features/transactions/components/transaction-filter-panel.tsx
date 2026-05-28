import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TRANSACTION_FILTER_TYPES, TRANSACTION_STATUSES } from '@/features/transactions/schemas'
import type { Account } from '@/features/accounts/types'
import type { Category } from '@/features/categories/types'
import type {
  ListTransactionsParams,
  TransactionType,
  TransactionStatus,
} from '@/features/transactions/types'

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  REFUND: 'Reembolso',
  TRANSFER: 'Transferência',
}

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
}

interface TransactionFilterPanelProps {
  filters: ListTransactionsParams
  accounts: Account[]
  categories: Category[]
  includeCancelled: boolean
  onFiltersChange: (filters: ListTransactionsParams) => void
  onReset: () => void
  onToggleIncludeCancelled: () => void
}

export function TransactionFilterPanel({
  filters,
  accounts,
  categories,
  includeCancelled,
  onFiltersChange,
  onReset,
  onToggleIncludeCancelled,
}: TransactionFilterPanelProps) {
  function update(patch: Partial<ListTransactionsParams>) {
    onFiltersChange({ ...filters, ...patch, page: 0 })
  }

  return (
    <div className="filterbar" role="search" aria-label="Filtrar transações">
      <div className="search">
        <Search size={13} className="ico" />
        <input
          placeholder="Buscar por descrição…"
          value={filters.searchText ?? ''}
          onChange={(e) => update({ searchText: e.target.value || undefined })}
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
        {TRANSACTION_STATUSES.map((s) => (
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
            {c.name}
          </option>
        ))}
      </select>

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
