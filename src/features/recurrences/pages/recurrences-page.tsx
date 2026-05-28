import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading recurrences"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div
            className="card-b animate-pulse"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-3 w-12 rounded bg-muted" />
              </div>
            </div>
            <div className="h-3 w-32 rounded bg-muted" />
            <div className="flex gap-1">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-7 w-14 rounded bg-muted" />
              ))}
            </div>
          </div>
        </div>
      ))}
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
    pauseRecurrence(recurrence.id)
  }

  function handleResume(recurrence: Recurrence) {
    resumeRecurrence(recurrence.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Recurrences</h1>
        <Button size="sm" className="min-h-[44px]" onClick={() => setCreateOpen(true)}>
          New Rule
        </Button>
      </div>

      {isLoading ? (
        <RecurrencesSkeleton />
      ) : isError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-destructive">Failed to load recurrence rules.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : !recurrences || recurrences.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No recurrence rules found.</p>
          <Button size="sm" className="min-h-[44px]" onClick={() => setCreateOpen(true)}>
            Create your first rule
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
