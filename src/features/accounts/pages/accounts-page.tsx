import { useState } from 'react'
import { ArrowLeftRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useUnarchiveAccount } from '@/features/accounts/hooks/use-unarchive-account'
import { AccountCard } from '@/features/accounts/components/account-card'
import { NewAccountCard } from '@/features/accounts/components/new-account-card'
import { DistributionCard } from '@/features/accounts/components/distribution-card'
import { RecentTransfersCard } from '@/features/accounts/components/recent-transfers-card'
import { CreateAccountDialog } from '@/features/accounts/components/create-account-dialog'
import { EditAccountDialog } from '@/features/accounts/components/edit-account-dialog'
import { DeleteAccountDialog } from '@/features/accounts/components/delete-account-dialog'
import { ArchiveAccountDialog } from '@/features/accounts/components/archive-account-dialog'
import { AdjustBalanceDialog } from '@/features/accounts/components/adjust-balance-dialog'
import { CreateTransferDialog } from '@/features/accounts/components/create-transfer-dialog'
import type { Account } from '@/features/accounts/types'

function AccountsSkeleton() {
  return (
    <div className="grid grid-3 mb-6 animate-pulse" aria-busy="true" aria-label="Carregando contas">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-3)' }}
            />
            <div
              style={{ height: 12, width: 100, background: 'var(--surface-3)', borderRadius: 4 }}
            />
            <div
              style={{ height: 28, width: 140, background: 'var(--surface-3)', borderRadius: 4 }}
            />
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

  const activeAccounts = accounts ?? []
  const totalBalance = activeAccounts.reduce((sum, a) => sum + parseFloat(a.balance), 0)

  function handleUnarchive(account: Account) {
    unarchiveAccount(account.id)
  }

  function handleTransfer(account: Account) {
    setTransferSource(account)
    setTransferOpen(true)
  }

  return (
    <div>
      {/* Page header */}
      <div className="page-h">
        <div>
          <h1 className="title">Contas</h1>
          <div className="desc">
            {isLoading ? (
              'Carregando…'
            ) : isError ? (
              '—'
            ) : (
              <>
                {activeAccounts.length} {activeAccounts.length === 1 ? 'conta' : 'contas'} · saldo
                total{' '}
                <span className="mono fw-500" style={{ color: 'var(--text)' }}>
                  <Money value={totalBalance} />
                </span>
              </>
            )}
          </div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowArchived((v) => !v)}
            aria-pressed={showArchived}
          >
            {showArchived ? 'Ocultar arquivadas' : 'Mostrar arquivadas'}
          </Button>
          <Button leading={<ArrowLeftRight size={14} />} onClick={() => setTransferOpen(true)}>
            Transferir
          </Button>
          <Button
            variant="primary"
            leading={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
            aria-label="Nova conta"
          >
            Nova conta
          </Button>
        </div>
      </div>

      {/* Account cards grid */}
      {isLoading ? (
        <AccountsSkeleton />
      ) : isError ? (
        <div role="alert" style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--expense)', fontSize: 13, marginBottom: 8 }}>
            Erro ao carregar contas.
          </p>
          <Button size="sm" variant="ghost" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : activeAccounts.length === 0 ? (
        <div className="grid grid-3 mb-6">
          <NewAccountCard onClick={() => setCreateOpen(true)} />
        </div>
      ) : (
        <div className="grid grid-3 mb-6">
          {activeAccounts.map((account) => (
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
          {!showArchived && <NewAccountCard onClick={() => setCreateOpen(true)} />}
        </div>
      )}

      {/* Distribution + recent transfers */}
      {!isLoading && !isError && activeAccounts.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          <DistributionCard accounts={activeAccounts} totalBalance={totalBalance} />
          <RecentTransfersCard />
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
        accounts={activeAccounts}
        open={transferOpen}
        onClose={() => {
          setTransferOpen(false)
          setTransferSource(null)
        }}
      />
    </div>
  )
}
