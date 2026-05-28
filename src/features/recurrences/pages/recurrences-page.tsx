import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
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
    <div className="grid grid-3" aria-busy="true" aria-label="Carregando recorrências">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div
            className="card-b animate-pulse"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div
              style={{ height: 14, width: '70%', background: 'var(--surface-3)', borderRadius: 4 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <div
                style={{ height: 10, width: 60, background: 'var(--surface-3)', borderRadius: 4 }}
              />
              <div
                style={{ height: 10, width: 60, background: 'var(--surface-3)', borderRadius: 4 }}
              />
            </div>
            <div
              style={{ height: 10, width: '40%', background: 'var(--surface-3)', borderRadius: 4 }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  style={{ height: 28, width: 56, background: 'var(--surface-3)', borderRadius: 4 }}
                />
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
        <div className="card">
          <div
            className="card-b"
            role="alert"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <p style={{ color: 'var(--expense)', fontSize: 14 }}>Falha ao carregar recorrências.</p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
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
        <div className="grid grid-3">
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
