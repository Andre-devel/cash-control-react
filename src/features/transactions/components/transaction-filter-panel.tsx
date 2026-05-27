import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from './transaction-form-fields'
import { TRANSACTION_TYPES, TRANSACTION_STATUSES } from '@/features/transactions/schemas'
import type { Account } from '@/features/accounts/types'
import type { Category } from '@/features/categories/types'
import type { ListTransactionsParams } from '@/features/transactions/types'

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
}

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
}

interface TransactionFilterPanelProps {
  filters: ListTransactionsParams
  accounts: Account[]
  categories: Category[]
  onFiltersChange: (filters: ListTransactionsParams) => void
  onReset: () => void
}

export function TransactionFilterPanel({
  filters,
  accounts,
  categories,
  onFiltersChange,
  onReset,
}: TransactionFilterPanelProps) {
  function update(patch: Partial<ListTransactionsParams>) {
    onFiltersChange({ ...filters, ...patch, page: 0 })
  }

  return (
    <div
      className="rounded-md border border-border p-4 space-y-3"
      role="search"
      aria-label="Filter transactions"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-search">
            Search
          </label>
          <Input
            id="filter-search"
            placeholder="Search transactions…"
            value={filters.searchText ?? ''}
            onChange={(e) => update({ searchText: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-account">
            Account
          </label>
          <NativeSelect
            id="filter-account"
            aria-label="Filter by account"
            value={filters.accountId ?? ''}
            onChange={(e) => update({ accountId: e.target.value || undefined })}
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-type">
            Type
          </label>
          <NativeSelect
            id="filter-type"
            aria-label="Filter by type"
            value={filters.type ?? ''}
            onChange={(e) =>
              update({
                type: (e.target.value as ListTransactionsParams['type']) || undefined,
              })
            }
          >
            <option value="">All types</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TRANSACTION_TYPE_LABELS[t]}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-status">
            Status
          </label>
          <NativeSelect
            id="filter-status"
            aria-label="Filter by status"
            value={filters.status ?? ''}
            onChange={(e) =>
              update({
                status: (e.target.value as ListTransactionsParams['status']) || undefined,
              })
            }
          >
            <option value="">All statuses</option>
            {TRANSACTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TRANSACTION_STATUS_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-category">
            Category
          </label>
          <NativeSelect
            id="filter-category"
            aria-label="Filter by category"
            value={filters.categoryId ?? ''}
            onChange={(e) => update({ categoryId: e.target.value || undefined })}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-date-from">
            Date from
          </label>
          <Input
            id="filter-date-from"
            type="date"
            value={filters.competenceDateFrom ?? ''}
            onChange={(e) => update({ competenceDateFrom: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-date-to">
            Date to
          </label>
          <Input
            id="filter-date-to"
            type="date"
            value={filters.competenceDateTo ?? ''}
            onChange={(e) => update({ competenceDateTo: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-amount-min">
            Amount min
          </label>
          <Input
            id="filter-amount-min"
            placeholder="e.g. 10.00"
            value={filters.amountMin ?? ''}
            onChange={(e) => update({ amountMin: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-amount-max">
            Amount max
          </label>
          <Input
            id="filter-amount-max"
            placeholder="e.g. 1000.00"
            value={filters.amountMax ?? ''}
            onChange={(e) => update({ amountMax: e.target.value || undefined })}
          />
        </div>
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  )
}
