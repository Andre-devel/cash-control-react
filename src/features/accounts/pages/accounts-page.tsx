import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useUnarchiveAccount } from '@/features/accounts/hooks/use-unarchive-account'
import { AccountCard } from '@/features/accounts/components/account-card'
import { CreateAccountDialog } from '@/features/accounts/components/create-account-dialog'
import { EditAccountDialog } from '@/features/accounts/components/edit-account-dialog'
import { DeleteAccountDialog } from '@/features/accounts/components/delete-account-dialog'
import { ArchiveAccountDialog } from '@/features/accounts/components/archive-account-dialog'
import { AdjustBalanceDialog } from '@/features/accounts/components/adjust-balance-dialog'
import { CreateTransferDialog } from '@/features/accounts/components/create-transfer-dialog'
import type { Account } from '@/features/accounts/types'

function AccountsSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading accounts"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div className="card-b space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <div className="space-y-1 flex-1">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-7 w-14 rounded bg-muted" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AccountsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const {
    data: accounts,
    isLoading,
    isError,
    refetch,
  } = useAccounts({ includeArchived: showArchived })
  const { mutate: unarchiveAccount } = useUnarchiveAccount()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Account | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Account | null>(null)
  const [adjustTarget, setAdjustTarget] = useState<Account | null>(null)
  const [transferSource, setTransferSource] = useState<Account | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)

  function handleUnarchive(account: Account) {
    unarchiveAccount(account.id)
  }

  function handleTransfer(account: Account) {
    setTransferSource(account)
    setTransferOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setShowArchived((v) => !v)}
            aria-pressed={showArchived}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <Button
            size="sm"
            className="min-h-[44px]"
            onClick={() => setCreateOpen(true)}
            aria-label="New Account"
          >
            New Account
          </Button>
        </div>
      </div>

      {isLoading ? (
        <AccountsSkeleton />
      ) : isError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-destructive">Failed to load accounts.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : !accounts || accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No accounts found.</p>
          <Button size="sm" className="min-h-[44px]" onClick={() => setCreateOpen(true)}>
            Create your first account
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={(a) => setEditTarget(a)}
              onDelete={(a) => setDeleteTarget(a)}
              onArchive={(a) => setArchiveTarget(a)}
              onUnarchive={handleUnarchive}
              onAdjust={(a) => setAdjustTarget(a)}
              onTransfer={handleTransfer}
            />
          ))}
        </div>
      )}

      <CreateAccountDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditAccountDialog
        account={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
      />

      <DeleteAccountDialog
        account={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      />

      <ArchiveAccountDialog
        account={archiveTarget}
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
      />

      <AdjustBalanceDialog
        account={adjustTarget}
        open={adjustTarget !== null}
        onClose={() => setAdjustTarget(null)}
      />

      <CreateTransferDialog
        defaultFromAccount={transferSource}
        accounts={accounts ?? []}
        open={transferOpen}
        onClose={() => {
          setTransferOpen(false)
          setTransferSource(null)
        }}
      />
    </div>
  )
}
