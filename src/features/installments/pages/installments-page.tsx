import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useInstallmentSeries } from '@/features/installments/hooks/use-installment-series'
import { InstallmentSeriesCard } from '@/features/installments/components/installment-series-card'
import { CreateInstallmentDialog } from '@/features/installments/components/create-installment-dialog'
import { EditSeriesDialog } from '@/features/installments/components/edit-series-dialog'
import { EditInstallmentDialog } from '@/features/installments/components/edit-installment-dialog'
import { SettleSeriesDialog } from '@/features/installments/components/settle-series-dialog'
import { AdvanceInstallmentsDialog } from '@/features/installments/components/advance-installments-dialog'
import type { InstallmentSeries } from '@/features/installments/types'

function InstallmentsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading installments">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 rounded-md border border-border bg-muted animate-pulse" />
      ))}
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Installments</h1>
        <Button size="sm" className="min-h-[44px]" onClick={() => setCreateOpen(true)}>
          New Series
        </Button>
      </div>

      {isLoading ? (
        <InstallmentsSkeleton />
      ) : isError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-destructive">Failed to load installment series.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : !series || series.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No installment series found.</p>
          <Button size="sm" className="min-h-[44px]" onClick={() => setCreateOpen(true)}>
            Create your first series
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {series.map((s) => (
            <InstallmentSeriesCard
              key={s.id}
              series={s}
              onEditSeries={setEditSeriesTarget}
              onEditInstallment={setEditInstallmentTarget}
              onSettle={setSettleTarget}
              onAdvance={setAdvanceTarget}
            />
          ))}
        </div>
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
    </div>
  )
}
