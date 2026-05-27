import { useCallback, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTransactions } from '@/features/transactions/hooks/use-transactions'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { TransactionRow } from '@/features/transactions/components/transaction-row'
import { TransactionFilterPanel } from '@/features/transactions/components/transaction-filter-panel'
import { CreateTransactionDialog } from '@/features/transactions/components/create-transaction-dialog'
import { EditTransactionDialog } from '@/features/transactions/components/edit-transaction-dialog'
import { DeleteTransactionDialog } from '@/features/transactions/components/delete-transaction-dialog'
import { CancelTransactionDialog } from '@/features/transactions/components/cancel-transaction-dialog'
import { usePayTransaction } from '@/features/transactions/hooks/use-pay-transaction'
import { ROUTES } from '@/app/router/routes'
import type { Transaction, ListTransactionsParams } from '@/features/transactions/types'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_SORT = 'competenceDate,desc'

function buildParams(searchParams: URLSearchParams): ListTransactionsParams {
  const get = (key: string) => searchParams.get(key) ?? undefined
  return {
    accountId: get('accountId'),
    type: get('type') as ListTransactionsParams['type'],
    status: get('status') as ListTransactionsParams['status'],
    categoryId: get('categoryId'),
    competenceDateFrom: get('competenceDateFrom'),
    competenceDateTo: get('competenceDateTo'),
    paymentDateFrom: get('paymentDateFrom'),
    paymentDateTo: get('paymentDateTo'),
    amountMin: get('amountMin'),
    amountMax: get('amountMax'),
    searchText: get('searchText'),
    includeCancelled: searchParams.get('includeCancelled') === 'true',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 0,
    size: DEFAULT_PAGE_SIZE,
    sort: DEFAULT_SORT,
  }
}

function paramsToSearchParams(params: ListTransactionsParams): Record<string, string> {
  const out: Record<string, string> = {}
  if (params.accountId) out.accountId = params.accountId
  if (params.type) out.type = params.type
  if (params.status) out.status = params.status
  if (params.categoryId) out.categoryId = params.categoryId
  if (params.competenceDateFrom) out.competenceDateFrom = params.competenceDateFrom
  if (params.competenceDateTo) out.competenceDateTo = params.competenceDateTo
  if (params.amountMin) out.amountMin = params.amountMin
  if (params.amountMax) out.amountMax = params.amountMax
  if (params.searchText) out.searchText = params.searchText
  if (params.includeCancelled) out.includeCancelled = 'true'
  if (params.page && params.page > 0) out.page = String(params.page)
  return out
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading transactions">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
      ))}
    </div>
  )
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const filters = buildParams(searchParams)

  const { data: pageData, isLoading, isError, refetch } = useTransactions(filters)

  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { mutate: payTransaction } = usePayTransaction()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Transaction | null>(null)

  const handleFiltersChange = useCallback(
    (newFilters: ListTransactionsParams) => {
      setSearchParams(paramsToSearchParams(newFilters), { replace: true })
    },
    [setSearchParams],
  )

  const handleReset = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const handlePageChange = (page: number) => {
    setSearchParams(paramsToSearchParams({ ...filters, page }), { replace: true })
  }

  const transactions = pageData?.content ?? []
  const totalPages = pageData?.totalPages ?? 0
  const currentPage = filters.page ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={() =>
              handleFiltersChange({ ...filters, includeCancelled: !filters.includeCancelled })
            }
            aria-pressed={filters.includeCancelled}
          >
            {filters.includeCancelled ? 'Hide Cancelled' : 'Show Cancelled'}
          </Button>
          <Button
            size="sm"
            className="min-h-[44px]"
            onClick={() => setCreateOpen(true)}
            aria-label="New Transaction"
          >
            New Transaction
          </Button>
        </div>
      </div>

      <TransactionFilterPanel
        filters={filters}
        accounts={accounts}
        categories={categories}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
      />

      {isLoading ? (
        <TransactionsSkeleton />
      ) : isError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-destructive">Failed to load transactions.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No transactions found.</p>
          <Button size="sm" className="min-h-[44px]" onClick={() => setCreateOpen(true)}>
            Create your first transaction
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onPay={(t) => payTransaction(t.id)}
              onCancel={setCancelTarget}
              onView={(t) => void navigate(ROUTES.TRANSACTION_DETAIL.replace(':id', t.id))}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages - 1}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <CreateTransactionDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditTransactionDialog
        transaction={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
      />

      <DeleteTransactionDialog
        transaction={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      />

      <CancelTransactionDialog
        transaction={cancelTarget}
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  )
}
