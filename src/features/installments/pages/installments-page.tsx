import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Money } from '@/components/ui/money'
import { useInstallmentSeries } from '@/features/installments/hooks/use-installment-series'
import { InstallmentSeriesCard } from '@/features/installments/components/installment-series-card'
import { CreateInstallmentDialog } from '@/features/installments/components/create-installment-dialog'
import { EditSeriesDialog } from '@/features/installments/components/edit-series-dialog'
import { EditInstallmentDialog } from '@/features/installments/components/edit-installment-dialog'
import { SettleSeriesDialog } from '@/features/installments/components/settle-series-dialog'
import { AdvanceInstallmentsDialog } from '@/features/installments/components/advance-installments-dialog'
import { DeleteSeriesDialog } from '@/features/installments/components/delete-series-dialog'
import type { InstallmentSeries } from '@/features/installments/types'

function InstallmentsSkeleton() {
  return (
    <div
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Carregando parcelamentos"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col gap-3 rounded-xl border border-border bg-surface-1 p-4 motion-reduce:animate-none"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-surface-3" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-3/5 rounded-xs bg-surface-3" />
              <div className="h-3 w-2/5 rounded-xs bg-surface-3" />
            </div>
          </div>
          <div className="h-2 w-full rounded-xs bg-surface-3" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-8 rounded-xs bg-surface-3" />
            ))}
          </div>
          <div className="h-11 w-full rounded-md bg-surface-3" />
        </div>
      ))}
    </div>
  )
}

function SeriesSummary({ series }: { series: InstallmentSeries[] }) {
  const open = series.filter((s) => !s.settled && !s.completed)
  const outstanding = open.reduce((sum, s) => sum + parseFloat(s.remainingAmount), 0)
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3.5 shadow-1 md:max-w-md">
      <div className="flex flex-col gap-1">
        <span className="text-caption text-fg-muted">Saldo devedor</span>
        <span className="text-amount-lg text-fg tabular-nums">
          <Money value={outstanding} />
        </span>
      </div>
      <div className="flex flex-col gap-1 border-l border-border pl-3">
        <span className="text-caption text-fg-muted">Séries em aberto</span>
        <span className="text-amount-lg text-fg tabular-nums">{open.length}</span>
      </div>
    </div>
  )
}

export default function InstallmentsPage() {
  const { data: series, isLoading, isError, refetch } = useInstallmentSeries()

  const [createOpen, setCreateOpen] = useState(false)
  const [editSeriesTarget, setEditSeriesTarget] = useState<InstallmentSeries | null>(null)
  const [editInstallmentTarget, setEditInstallmentTarget] = useState<InstallmentSeries | null>(null)
  const [settleTarget, setSettleTarget] = useState<InstallmentSeries | null>(null)
  const [advanceTarget, setAdvanceTarget] = useState<InstallmentSeries | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InstallmentSeries | null>(null)

  const seriesList = series ?? []

  return (
    <div>
      <div className="page-h">
        <div>
          <h1 className="title">Parcelamentos</h1>
          <div className="desc">
            {isLoading
              ? 'Carregando…'
              : isError
                ? '—'
                : `${seriesList.length} ${seriesList.length === 1 ? 'série' : 'séries'}`}
          </div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <Button
            variant="primary"
            leading={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            Nova série
          </Button>
        </div>
      </div>

      {isLoading ? (
        <InstallmentsSkeleton />
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface-1 p-4"
        >
          <p className="text-body-sm text-overdue">Falha ao carregar parcelamentos.</p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : !series || series.length === 0 ? (
        <EmptyState
          title="Nenhuma série de parcelamentos"
          desc="Crie sua primeira série para acompanhar suas compras parceladas."
          action={
            <Button
              variant="primary"
              leading={<Plus size={14} />}
              onClick={() => setCreateOpen(true)}
            >
              Criar primeira série
            </Button>
          }
        />
      ) : (
        <>
          <SeriesSummary series={series} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {series.map((s) => (
              <InstallmentSeriesCard
                key={s.id}
                series={s}
                onEditSeries={setEditSeriesTarget}
                onEditInstallment={setEditInstallmentTarget}
                onSettle={setSettleTarget}
                onAdvance={setAdvanceTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </>
      )}

      <CreateInstallmentDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditSeriesDialog
        series={editSeriesTarget}
        open={editSeriesTarget !== null}
        onClose={() => setEditSeriesTarget(null)}
      />

      <EditInstallmentDialog
        series={editInstallmentTarget}
        open={editInstallmentTarget !== null}
        onClose={() => setEditInstallmentTarget(null)}
      />

      <SettleSeriesDialog
        series={settleTarget}
        open={settleTarget !== null}
        onClose={() => setSettleTarget(null)}
      />

      <AdvanceInstallmentsDialog
        series={advanceTarget}
        open={advanceTarget !== null}
        onClose={() => setAdvanceTarget(null)}
      />

      <DeleteSeriesDialog
        series={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
