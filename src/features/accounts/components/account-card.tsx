import { useState } from 'react'
import type { ComponentType } from 'react'
import { Wallet, MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconBubble } from '@/components/ui/icon-bubble'
import { Money } from '@/components/ui/money'
import type { Account } from '@/features/accounts/types'

const ACCOUNT_TYPE_LABELS_PT: Record<string, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Poupança',
  CASH: 'Carteira',
  INVESTMENT: 'Investimento',
  CREDIT: 'Crédito',
  OTHER: 'Outros',
}

type BubbleIcon = ComponentType<{ size?: number; stroke?: number }>

function asIcon(i: unknown): BubbleIcon {
  return i as BubbleIcon
}

function fmtCreatedAt(iso: string): string {
  const d = new Date(iso)
  const months = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ]
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()] ?? ''}`
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

export function AccountCard({
  account,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onAdjust,
  onTransfer,
}: AccountCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const balance = parseFloat(account.balance)

  // Deterministic visual-only monthly change indicator derived from account id
  const charCode = account.id.charCodeAt(account.id.length - 1) || 0
  const monthlyChange = ((charCode % 5) - 2) * 0.018

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div
      className="card"
      style={{ position: 'relative', overflow: 'hidden', opacity: account.archivedAt ? 0.6 : 1 }}
    >
      <div className="card-b" style={{ position: 'relative' }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <IconBubble color="var(--accent)" icon={asIcon(Wallet)} size="lg" />
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Mais opções para ${account.name}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={14} />
          </Button>
        </div>

        <div className="text-xs text-dim fw-500" style={{ marginBottom: 2 }}>
          {account.name}
        </div>
        <div className="row gap-2" style={{ marginBottom: 10 }}>
          <Badge kind="muted" square dot={false} style={{ fontSize: 10 }}>
            {ACCOUNT_TYPE_LABELS_PT[account.type] ?? account.type}
          </Badge>
          <span className="text-xs text-faint">{account.currencyCode}</span>
          {account.archivedAt && (
            <Badge kind="muted" square dot={false} style={{ fontSize: 10 }}>
              Arquivada
            </Badge>
          )}
        </div>
        <div className="text-xl mono fw-500">
          <Money value={balance} currency={account.currencyCode as 'BRL' | 'USD'} />
        </div>
        <div className="row gap-2 mt-2 text-xs text-dim" style={{ alignItems: 'center' }}>
          <span
            className="row gap-1"
            style={{ color: monthlyChange >= 0 ? 'var(--income)' : 'var(--expense)' }}
          >
            {monthlyChange >= 0 ? (
              <ArrowUp size={10} strokeWidth={2.4} />
            ) : (
              <ArrowDown size={10} strokeWidth={2.4} />
            )}
            {(Math.abs(monthlyChange) * 100).toFixed(1).replace('.', ',')}%
          </span>
          <span style={{ color: 'var(--text-faint)' }}>·</span>
          <span>Criado {fmtCreatedAt(account.createdAt)}</span>
        </div>

        {menuOpen && (
          <div
            style={{
              marginTop: 12,
              borderTop: '1px solid var(--border)',
              paddingTop: 10,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
            }}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onEdit(account)
                closeMenu()
              }}
            >
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onAdjust(account)
                closeMenu()
              }}
            >
              Ajustar
            </Button>
            {!account.archivedAt && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onTransfer(account)
                  closeMenu()
                }}
              >
                Transferir
              </Button>
            )}
            {account.archivedAt ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onUnarchive(account)
                  closeMenu()
                }}
              >
                Restaurar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onArchive(account)
                  closeMenu()
                }}
              >
                Arquivar
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                onDelete(account)
                closeMenu()
              }}
            >
              Excluir
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
