import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <Card className={account.archived ? 'opacity-60' : ''}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: account.color }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{account.name}</p>
              <p className="text-xs text-muted-foreground">
                {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                {account.archived && (
                  <span className="ml-2 text-yellow-600 dark:text-yellow-400">(Archived)</span>
                )}
              </p>
            </div>
          </div>
          <p className="font-mono font-semibold text-sm text-foreground shrink-0">
            {formatBalance(account.balance, account.currency)}
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs min-h-[36px]"
            onClick={() => onEdit(account)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs min-h-[36px]"
            onClick={() => onAdjust(account)}
          >
            Adjust
          </Button>
          {!account.archived && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[36px]"
              onClick={() => onTransfer(account)}
            >
              Transfer
            </Button>
          )}
          {account.archived ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[36px]"
              onClick={() => onUnarchive(account)}
            >
              Restore
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[36px]"
              onClick={() => onArchive(account)}
            >
              Archive
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-destructive hover:text-destructive min-h-[36px]"
            onClick={() => onDelete(account)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
