import { ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/money'
import { useRecentTransfers } from '@/features/accounts/hooks/use-recent-transfers'

/** `2026-10-26` → `26/10/2026`, sem passar por `Date` (evita deslocar o dia pelo fuso). */
function fmtDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day.slice(0, 2)}/${month}/${year}`
}

function TransferSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex min-h-[62px] items-center gap-3 border-b border-border last:border-b-0"
        >
          <div className="h-9 w-9 shrink-0 rounded-sm bg-surface-3" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-3 w-36 rounded-xs bg-surface-3" />
            <div className="h-2.5 w-20 rounded-xs bg-surface-3" />
          </div>
          <div className="h-3.5 w-16 rounded-xs bg-surface-3" />
        </div>
      ))}
    </div>
  )
}

export function RecentTransfersCard() {
  const { data: transfers = [], isLoading, isError, refetch } = useRecentTransfers(4)

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby="recent-transfers-title">
      <div className="flex flex-col gap-0.5 px-1">
        <h2 id="recent-transfers-title" className="font-display text-h2 text-fg">
          Transferências recentes
        </h2>
        <p className="text-body-sm text-fg-muted">Entre suas contas</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface-1 px-3.5">
        {isLoading ? (
          <TransferSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-start gap-2 py-4" role="alert">
            <p className="text-body-sm text-expense">Erro ao carregar transferências.</p>
            <Button size="sm" variant="ghost" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : transfers.length === 0 ? (
          <p className="py-8 text-center text-body-sm text-fg-muted">
            Nenhuma transferência recente.
          </p>
        ) : (
          <ul className="m-0 list-none p-0">
            {transfers.map((t) => (
              <li
                key={t.id}
                className="flex min-h-[62px] items-center gap-3 border-b border-border py-2 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-info-soft text-info"
                >
                  <ArrowLeftRight size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-body-sm font-medium text-fg">{t.description}</span>
                  <span className="text-caption text-fg-muted">{fmtDate(t.competenceDate)}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-body-sm font-semibold tabular-nums text-fg">
                  {formatMoney(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
