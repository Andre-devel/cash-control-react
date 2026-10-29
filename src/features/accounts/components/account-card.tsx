import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive } from 'lucide-react'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/action-menu'
import { ROUTES } from '@/app/router/routes'
import {
  AccountTypeBubble,
  accountTypeLabel,
  formatBalance,
} from '@/features/accounts/utils/account-visual'
import type { Account } from '@/features/accounts/types'

interface AccountCardProps {
  account: Account
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
  onArchive: (account: Account) => void
  onUnarchive: (account: Account) => void
  onAdjust: (account: Account) => void
  onTransfer: (account: Account) => void
}

export function accountDetailPath(id: string): string {
  return ROUTES.ACCOUNT_DETAIL.replace(':id', encodeURIComponent(id))
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
  const navigate = useNavigate()
  const balance = parseFloat(account.balance)
  const archived = Boolean(account.archivedAt)
  const detailPath = accountDetailPath(account.id)

  const items: ActionMenuItem[] = [
    { label: 'Editar', onSelect: () => onEdit(account) },
    { label: 'Ajustar', onSelect: () => onAdjust(account) },
    ...(archived ? [] : [{ label: 'Transferir', onSelect: () => onTransfer(account) }]),
    archived
      ? { label: 'Restaurar', onSelect: () => onUnarchive(account) }
      : { label: 'Arquivar', onSelect: () => onArchive(account) },
    { label: 'Excluir', onSelect: () => onDelete(account), danger: true },
  ]

  // O card inteiro leva ao detalhe; o link do nome é o caminho por teclado/leitor de tela.
  function handleCardClick(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented) return
    if ((event.target as HTMLElement).closest('a')) return
    navigate(detailPath)
  }

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex min-w-0 cursor-pointer flex-col gap-3 rounded-xl border border-border bg-surface-1 p-3.5 transition-colors hover:border-border-strong focus-within:border-border-strong md:p-4${
        archived ? ' opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <AccountTypeBubble type={account.type} />
        {/* Menu ⋯: o clique (inclusive nos itens, que vivem num portal) não pode abrir o detalhe. */}
        <div className="-mr-1.5 -mt-1.5" onClick={(e) => e.stopPropagation()}>
          <ActionMenu label={`Mais opções para ${account.name}`} items={items} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <Link
          to={detailPath}
          className="truncate text-body font-semibold text-fg no-underline outline-none focus-visible:underline"
        >
          {account.name}
        </Link>
        <span className="flex flex-wrap items-center gap-1.5 text-caption text-fg-muted">
          {accountTypeLabel(account.type)}
          {account.currencyCode !== 'BRL' && <span>· {account.currencyCode}</span>}
          {archived && (
            <span className="inline-flex items-center gap-1">
              · <Archive size={12} aria-hidden="true" />
              Arquivada
            </span>
          )}
        </span>
      </div>

      <span
        className={`mt-auto font-sans text-amount-lg font-bold tabular-nums ${
          balance < 0 ? 'text-expense' : 'text-fg'
        }`}
      >
        {formatBalance(balance, account.currencyCode)}
      </span>
    </div>
  )
}
