import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

function AccountDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading account">
      <div className="h-6 w-48 rounded" style={{ background: 'var(--surface-3)' }} />
      <div className="h-20 rounded" style={{ background: 'var(--surface-3)' }} />
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

      <h1 className="fw-700" style={{ fontSize: 24, letterSpacing: '-0.01em' }}>
        {account?.name ?? 'Account'}
      </h1>

      {isLoading ? (
        <AccountDetailSkeleton />
      ) : isError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm" style={{ color: 'var(--expense)' }}>
            Failed to load account.
          </p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
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
                <Badge kind="pending" dot={false} square>
                  Archived
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
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
                  <p className="text-xs text-dim">Type</p>
                  <p className="fw-500">{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</p>
                </div>
                <div>
                  <p className="text-xs text-dim">Balance</p>
                  <p className="mono fw-600">{account.balance}</p>
                </div>
                <div>
                  <p className="text-xs text-dim">Currency</p>
                  <p className="fw-500">{account.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-dim">Icon</p>
                  <p className="fw-500">{account.icon}</p>
                </div>
                <div>
                  <p className="text-xs text-dim">Created</p>
                  <p className="fw-500">{new Date(account.createdAt).toLocaleDateString()}</p>
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
