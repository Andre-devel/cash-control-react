import type { ComponentType } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { IconBubble } from '@/components/ui/icon-bubble'
import { Money } from '@/components/ui/money'
import { useRecentTransfers } from '@/features/accounts/hooks/use-recent-transfers'

type BubbleIcon = ComponentType<{ size?: number; stroke?: number }>

function asIcon(i: unknown): BubbleIcon {
  return i as BubbleIcon
}

const MONTH_ABBR_PT = [
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

function fmtDate(iso: string): string {
  const parts = iso.split('-')
  const day = parseInt(parts[2] ?? '1', 10)
  const month = parseInt(parts[1] ?? '1', 10) - 1
  const year = parts[0]
  return `${String(day).padStart(2, '0')} de ${MONTH_ABBR_PT[month] ?? ''} de ${year}`
}

function TransferSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="list-row">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--surface-3)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{ height: 12, width: 140, background: 'var(--surface-3)', borderRadius: 4 }}
            />
            <div
              style={{ height: 10, width: 80, background: 'var(--surface-3)', borderRadius: 4 }}
            />
          </div>
          <div style={{ height: 16, width: 70, background: 'var(--surface-3)', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  )
}

export function RecentTransfersCard() {
  const { data: transfers = [], isLoading, isError, refetch } = useRecentTransfers(4)

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Transferências recentes</h3>
          <div className="sub">Entre suas contas</div>
        </div>
      </div>
      <div className="card-b flush">
        {isLoading ? (
          <TransferSkeleton />
        ) : isError ? (
          <div style={{ padding: 16 }} role="alert">
            <p style={{ color: 'var(--expense)', fontSize: 13 }}>
              Erro ao carregar transferências.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              style={{
                color: 'var(--accent)',
                textDecoration: 'underline',
                background: 'none',
                border: 0,
                cursor: 'pointer',
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : transfers.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)', fontSize: 13 }}>
            Nenhuma transferência recente.
          </p>
        ) : (
          transfers.map((t) => (
            <div key={t.id} className="list-row">
              <IconBubble color="var(--info)" icon={asIcon(ArrowLeftRight)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="title">{t.description}</div>
                <div className="meta">{fmtDate(t.date)}</div>
              </div>
              <div className="amount mono">
                <Money value={parseFloat(t.amount)} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
