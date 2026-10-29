import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Money } from '@/components/ui/money'
import { useRecurrences } from '@/features/recurrences/hooks/use-recurrences'
import { usePauseRecurrence } from '@/features/recurrences/hooks/use-pause-recurrence'
import { useResumeRecurrence } from '@/features/recurrences/hooks/use-resume-recurrence'
import { RecurrenceCard } from '@/features/recurrences/components/recurrence-card'
import { CreateRecurrenceDialog } from '@/features/recurrences/components/create-recurrence-dialog'
import { EditRecurrenceDialog } from '@/features/recurrences/components/edit-recurrence-dialog'
import { DeleteRecurrenceDialog } from '@/features/recurrences/components/delete-recurrence-dialog'
import type { Recurrence } from '@/features/recurrences/types'

function RecurrencesSkeleton() {
  return (
    <div
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Carregando recorrências"
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
            <div className="h-4 w-16 rounded-xs bg-surface-3" />
          </div>
          <div className="h-3 w-full rounded-xs bg-surface-3" />
          <div className="flex gap-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-9 w-20 rounded-md bg-surface-3" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Quantas ocorrências de cada frequência cabem, em média, num mês. */
const MONTHLY_FACTOR: Record<Recurrence['frequency'], number> = {
  DAILY: 365 / 12,
  WEEKLY: 52 / 12,
  BIWEEKLY: 26 / 12,
  MONTHLY: 1,
  YEARLY: 1 / 12,
}

function RecurrencesSummary({ recurrences }: { recurrences: Recurrence[] }) {
  const active = recurrences.filter((r) => r.status === 'ACTIVE')
  const monthly = active
    .filter((r) => r.type === 'EXPENSE')
    .reduce((sum, r) => sum + parseFloat(r.amount) * (MONTHLY_FACTOR[r.frequency] ?? 1), 0)
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3.5 shadow-1 md:max-w-md">
      <div className="flex flex-col gap-1">
        <span className="text-caption text-fg-muted">
          Despesas recorrentes por mês (estimativa)
        </span>
        <span className="text-amount-lg text-fg tabular-nums">
          <Money value={monthly} />
        </span>
      </div>
      <span className="text-caption text-fg-muted">
        {active.length} {active.length === 1 ? 'ativa' : 'ativas'}
      </span>
    </div>
  )
}

export default function RecurrencesPage() {
  const { data: recurrences, isLoading, isError, refetch } = useRecurrences()
  const { mutate: pauseRecurrence } = usePauseRecurrence()
  const { mutate: resumeRecurrence } = useResumeRecurrence()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Recurrence | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Recurrence | null>(null)

  function handlePause(recurrence: Recurrence) {
    pauseRecurrence({ id: recurrence.id })
  }

  function handleResume(recurrence: Recurrence) {
    resumeRecurrence(recurrence.id)
  }

  const recurrenceList = recurrences ?? []

  return (
    <div>
      <div className="page-h">
        <div>
          <h1 className="title">Recorrências</h1>
          <div className="desc">
            {isLoading
              ? 'Carregando…'
              : isError
                ? '—'
                : `${recurrenceList.length} ${recurrenceList.length === 1 ? 'regra' : 'regras'}`}
          </div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <Button
            variant="primary"
            leading={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            Nova regra
          </Button>
        </div>
      </div>

      {isLoading ? (
        <RecurrencesSkeleton />
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface-1 p-4"
        >
          <p className="text-body-sm text-overdue">Falha ao carregar recorrências.</p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : !recurrences || recurrences.length === 0 ? (
        <EmptyState
          title="Nenhuma regra de recorrência"
          desc="Crie sua primeira regra para lançamentos automáticos recorrentes."
          action={
            <Button
              variant="primary"
              leading={<Plus size={14} />}
              onClick={() => setCreateOpen(true)}
            >
              Criar primeira regra
            </Button>
          }
        />
      ) : (
        <>
          <RecurrencesSummary recurrences={recurrences} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recurrences.map((recurrence) => (
              <RecurrenceCard
                key={recurrence.id}
                recurrence={recurrence}
                onEdit={(r) => setEditTarget(r)}
                onDelete={(r) => setDeleteTarget(r)}
                onPause={handlePause}
                onResume={handleResume}
              />
            ))}
          </div>
        </>
      )}

      <CreateRecurrenceDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditRecurrenceDialog
        recurrence={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
      />

      <DeleteRecurrenceDialog
        recurrence={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
