import { useState, type ComponentType, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeftRight, ChevronLeft, ListOrdered, Pencil, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccount } from '@/features/accounts/hooks/use-account'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { EditAccountDialog } from '@/features/accounts/components/edit-account-dialog'
import { AdjustBalanceDialog } from '@/features/accounts/components/adjust-balance-dialog'
import { CreateTransferDialog } from '@/features/accounts/components/create-transfer-dialog'
import {
  AccountTypeBubble,
  accountTypeColor,
  accountTypeLabel,
  formatBalance,
} from '@/features/accounts/utils/account-visual'
import { ROUTES } from '@/app/router/routes'
import { formatInstantDate } from '@/lib/format-date'

function AccountDetailSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col gap-4 rounded-2xl border border-border bg-surface-1 p-5 motion-reduce:animate-none"
      aria-busy="true"
      aria-label="Carregando conta"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-surface-3" />
        <div className="h-4 w-40 rounded-xs bg-surface-3" />
      </div>
      <div className="h-9 w-56 rounded-xs bg-surface-3" />
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-2" />
        ))}
      </div>
    </div>
  )
}

const ACTION_CLASS =
  'flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-lg border-0 bg-surface-2 px-1 py-2 text-center text-caption font-medium text-fg no-underline transition-colors hover:bg-surface-3 focus-visible:bg-surface-3 cursor-pointer'

interface QuickActionProps {
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  children: ReactNode
  onClick: () => void
}

function QuickAction({ icon: Icon, children, onClick }: QuickActionProps) {
  return (
    <button type="button" className={ACTION_CLASS} onClick={onClick}>
      <Icon size={19} aria-hidden />
      {children}
    </button>
  )
}

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: account, isLoading, isError, refetch } = useAccount(id ?? '')
  const { data: accounts } = useAccounts()
  const [editOpen, setEditOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  const balance = account ? parseFloat(account.balance) : 0

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="-ml-2 flex items-center gap-1">
        <Button variant="ghost" size="icon" className="min-h-touch min-w-touch" asChild>
          <Link to={ROUTES.ACCOUNTS} aria-label="Voltar para Contas">
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="min-w-0 flex-1 truncate font-display text-h1 text-fg">
          {account?.name ?? 'Conta'}
        </h1>
      </div>

      {isLoading ? (
        <AccountDetailSkeleton />
      ) : isError ? (
        <div
          className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface-1 p-4"
          role="alert"
        >
          <p className="text-body-sm text-expense">Falha ao carregar conta.</p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : account ? (
        <>
          <section
            className="flex flex-col gap-4 rounded-2xl border border-border p-5"
            style={{
              background: `radial-gradient(120% 90% at 100% 0%, ${accountTypeColor(account.type, 0.16)}, transparent 60%), rgb(var(--cc-surface-1))`,
            }}
            aria-label="Resumo da conta"
          >
            <div className="flex items-center gap-2.5">
              <AccountTypeBubble type={account.type} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-body font-semibold text-fg">{account.name}</span>
                <span className="text-caption text-fg-muted">
                  {accountTypeLabel(account.type)} · {account.currencyCode}
                  {account.archivedAt ? ' · Arquivada' : ''}
                </span>
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-body-sm text-fg-muted">Saldo atual</span>
              <span
                className={`font-display text-[2.25rem] font-extrabold leading-none tabular-nums ${
                  balance < 0 ? 'text-expense' : 'text-fg'
                }`}
              >
                {formatBalance(balance, account.currencyCode)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <QuickAction icon={Pencil} onClick={() => setEditOpen(true)}>
                Editar
              </QuickAction>
              <QuickAction icon={Scale} onClick={() => setAdjustOpen(true)}>
                Ajustar saldo
              </QuickAction>
              {account.archivedAt ? (
                <span aria-hidden="true" />
              ) : (
                <QuickAction icon={ArrowLeftRight} onClick={() => setTransferOpen(true)}>
                  Transferir
                </QuickAction>
              )}
              <Link
                to={`${ROUTES.TRANSACTIONS}?accountId=${encodeURIComponent(account.id)}`}
                className={ACTION_CLASS}
              >
                <ListOrdered size={19} aria-hidden="true" />
                Ver extrato
              </Link>
            </div>
          </section>

          <section
            className="rounded-2xl border border-border bg-surface-1 p-4 md:p-5"
            aria-labelledby="account-details-title"
          >
            <h2 id="account-details-title" className="mb-3 font-display text-h2 text-fg">
              Detalhes da conta
            </h2>
            <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <div>
                <dt className="text-caption text-fg-muted">Tipo</dt>
                <dd className="m-0 text-body-sm font-medium text-fg">
                  {accountTypeLabel(account.type)}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-fg-muted">Moeda</dt>
                <dd className="m-0 text-body-sm font-medium text-fg">{account.currencyCode}</dd>
              </div>
              <div>
                <dt className="text-caption text-fg-muted">Criada em</dt>
                <dd className="m-0 text-body-sm font-medium text-fg">
                  {formatInstantDate(account.createdAt)}
                </dd>
              </div>
              {account.description && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-caption text-fg-muted">Descrição</dt>
                  <dd className="m-0 text-body-sm text-fg">{account.description}</dd>
                </div>
              )}
            </dl>
          </section>

          <EditAccountDialog account={account} open={editOpen} onClose={() => setEditOpen(false)} />
          <AdjustBalanceDialog
            account={account}
            open={adjustOpen}
            onClose={() => setAdjustOpen(false)}
          />
          <CreateTransferDialog
            defaultFromAccount={account}
            accounts={accounts ?? []}
            open={transferOpen}
            onClose={() => setTransferOpen(false)}
          />
        </>
      ) : null}
    </div>
  )
}
