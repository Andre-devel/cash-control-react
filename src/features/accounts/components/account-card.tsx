import { Button } from '@/components/ui/button'
import type { Account } from '@/features/accounts/types'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CASH: 'Cash',
  INVESTMENT: 'Investment',
  CREDIT: 'Credit',
  OTHER: 'Other',
}

interface AccountCardProps {
  account: Account
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
  onArchive: (account: Account) => void
  onUnarchive: (account: Account) => void
  onAdjust: (account: Account) => void
  onTransfer: (account: Account) => void
}

function formatBalance(balance: string, currency: string): string {
  const num = parseFloat(balance)
  if (isNaN(num)) return balance
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(num)
}

export function AccountCard({
  account,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onAdjust,
  onTransfer,
}: AccountCardProps) {
  return (
    <div
      className={`card${account.archived ? ' opacity-60' : ''}`}
      style={{ opacity: account.archived ? 0.6 : undefined }}
    >
      <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="shrink-0"
              style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: account.color }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="fw-600 truncate">{account.name}</p>
              <p className="text-xs text-dim">
                {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                {account.archived && <span className="ml-2">(Archived)</span>}
              </p>
            </div>
          </div>
          <p className="mono fw-600 text-sm shrink-0">
            {formatBalance(account.balance, account.currency)}
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs min-h-[44px]"
            onClick={() => onEdit(account)}
            aria-label={`Edit ${account.name}`}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs min-h-[44px]"
            onClick={() => onAdjust(account)}
            aria-label={`Adjust balance of ${account.name}`}
          >
            Adjust
          </Button>
          {!account.archived && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[44px]"
              onClick={() => onTransfer(account)}
              aria-label={`Transfer from ${account.name}`}
            >
              Transfer
            </Button>
          )}
          {account.archived ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[44px]"
              onClick={() => onUnarchive(account)}
              aria-label={`Restore ${account.name}`}
            >
              Restore
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[44px]"
              onClick={() => onArchive(account)}
              aria-label={`Archive ${account.name}`}
            >
              Archive
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            className="text-xs min-h-[44px]"
            onClick={() => onDelete(account)}
            aria-label={`Delete ${account.name}`}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
