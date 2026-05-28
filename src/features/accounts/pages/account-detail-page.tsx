import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAccount } from '@/features/accounts/hooks/use-account'
import { EditAccountDialog } from '@/features/accounts/components/edit-account-dialog'
import { AdjustBalanceDialog } from '@/features/accounts/components/adjust-balance-dialog'
import { ROUTES } from '@/app/router/routes'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CASH: 'Cash',
  INVESTMENT: 'Investment',
  CREDIT: 'Credit',
  OTHER: 'Other',
}

function formatBalance(balance: string, currency: string): string {
  const num = parseFloat(balance)
  if (isNaN(num)) return balance
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(num)
}

function AccountDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading account">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="h-20 rounded bg-muted" />
    </div>
  )
}

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: account, isLoading, isError, refetch } = useAccount(id ?? '')
  const [editOpen, setEditOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.ACCOUNTS}>&larr; Accounts</Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{account?.name ?? 'Account'}</h1>

      {isLoading ? (
        <AccountDetailSkeleton />
      ) : isError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-destructive">Failed to load account.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : account ? (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: account.color }}
                aria-hidden="true"
              />
              {account.archived && (
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 border border-yellow-500 rounded px-1.5 py-0.5">
                  Archived
                </span>
              )}
            </div>
            <div className="flex gap-2">
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
                onClick={() => setAdjustOpen(true)}
              >
                Adjust Balance
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <h3>Account Details</h3>
            </div>
            <div className="card-b space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium">{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-mono font-semibold">
                    {formatBalance(account.balance, account.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="font-medium">{account.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Icon</p>
                  <p className="font-medium">{account.icon}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(account.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <EditAccountDialog account={account} open={editOpen} onClose={() => setEditOpen(false)} />
          <AdjustBalanceDialog
            account={account}
            open={adjustOpen}
            onClose={() => setAdjustOpen(false)}
          />
        </>
      ) : null}
    </div>
  )
}
