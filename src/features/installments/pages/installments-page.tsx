import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
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
    <div className="grid grid-3" aria-busy="true" aria-label="Carregando parcelamentos">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div
            className="card-b animate-pulse"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div
              style={{ height: 16, width: '60%', background: 'var(--surface-3)', borderRadius: 4 }}
            />
            <div
              style={{ height: 12, width: '40%', background: 'var(--surface-3)', borderRadius: 4 }}
            />
            <div
              style={{ height: 8, width: '100%', background: 'var(--surface-3)', borderRadius: 4 }}
            />
            <div
              style={{ height: 12, width: '30%', background: 'var(--surface-3)', borderRadius: 4 }}
            />
          </div>
        </div>
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
        <div className="card">
          <div
            className="card-b"
            role="alert"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <p style={{ color: 'var(--expense)', fontSize: 14 }}>
              Falha ao carregar parcelamentos.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
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
        <div className="grid grid-3">
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
