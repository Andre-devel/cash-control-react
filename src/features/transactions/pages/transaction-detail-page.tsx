import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTransaction } from '@/features/transactions/hooks/use-transaction'
import { AttachmentSection } from '@/features/transactions/components/attachment-section'
import { EditTransactionDialog } from '@/features/transactions/components/edit-transaction-dialog'
import { DeleteTransactionDialog } from '@/features/transactions/components/delete-transaction-dialog'
import { CancelTransactionDialog } from '@/features/transactions/components/cancel-transaction-dialog'
import { PayTransactionButton } from '@/features/transactions/components/pay-transaction-button'
import { ROUTES } from '@/app/router/routes'

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading transaction">
      <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      <div className="h-32 rounded-md bg-muted animate-pulse" />
    </div>
  )
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: transaction, isLoading, isError } = useTransaction(id)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (isLoading) return <DetailSkeleton />

  if (isError || !transaction) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Transaction</h1>
        <div role="alert">
          <p className="text-sm text-destructive">Failed to load transaction.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigate(ROUTES.TRANSACTIONS)}
            className="mt-2"
          >
            Back to Transactions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate(ROUTES.TRANSACTIONS)}
            className="mb-2"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{transaction.description}</h1>
        </div>

        <div className="flex items-center gap-2">
          <PayTransactionButton transaction={transaction} />
          {transaction.status !== 'CANCELLED' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setCancelOpen(true)}
              >
                Cancel
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="card-b space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-sm font-semibold">{transaction.amount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm">{TYPE_LABELS[transaction.type]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm">{STATUS_LABELS[transaction.status]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm">{transaction.competenceDate}</p>
            </div>
            {transaction.paymentDate && (
              <div>
                <p className="text-xs text-muted-foreground">Payment Date</p>
                <p className="text-sm">{transaction.paymentDate}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{new Date(transaction.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <AttachmentSection transactionId={transaction.id} />

      <EditTransactionDialog
        transaction={editOpen ? transaction : null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <DeleteTransactionDialog
        transaction={deleteOpen ? transaction : null}
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          void navigate(ROUTES.TRANSACTIONS)
        }}
      />

      <CancelTransactionDialog
        transaction={cancelOpen ? transaction : null}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  )
}
