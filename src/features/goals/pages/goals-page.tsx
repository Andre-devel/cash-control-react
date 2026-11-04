import { useMemo, useState } from 'react'
import { Goal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { Panel, SkeletonBlock, WidgetError } from '@/features/dashboard/components/panel'
import { GoalCard } from '@/features/goals/components/goal-card'
import { GoalDialog, type GoalDialogState } from '@/features/goals/components/goal-dialog'
import { useUnarchiveGoal } from '@/features/goals/hooks/use-goal-mutations'
import { useGoals } from '@/features/goals/hooks/use-goals'
import type { SavingsGoal } from '@/features/goals/types'
import { useHoldings } from '@/features/investments/hooks/use-investments'

const GRID = 'grid gap-3 md:grid-cols-2 xl:grid-cols-3'

export default function GoalsPage() {
  const [dialog, setDialog] = useState<GoalDialogState>(null)
  const [showArchived, setShowArchived] = useState(false)
  const { data, isLoading, isError, refetch } = useGoals()
  const { data: accounts } = useAccounts({ includeArchived: true })
  const { data: holdings } = useHoldings()
  const { mutate: unarchive } = useUnarchiveGoal()

  const goals = useMemo(() => data ?? [], [data])
  const active = goals.filter((g) => !g.archivedAt)
  const archived = goals.filter((g) => g.archivedAt)

  const linkLabels = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of accounts ?? []) map.set(`account:${a.id}`, `Conta ${a.name}`)
    for (const h of holdings ?? []) map.set(`holding:${h.id}`, `Aplicação ${h.name}`)
    return map
  }, [accounts, holdings])

  function linkLabel(goal: SavingsGoal): string | undefined {
    if (goal.accountId) return linkLabels.get(`account:${goal.accountId}`)
    if (goal.holdingId) return linkLabels.get(`holding:${goal.holdingId}`)
    return 'Sem vínculo: progresso fica em zero'
  }

  return (
    <div>
      <div className="page-h">
        <div>
          <h1 className="title">Metas</h1>
          <div className="desc">
            Quanto guardar e até quando, pelo saldo de uma conta ou aplicação.
          </div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <Button
            variant="primary"
            leading={<Plus size={16} aria-hidden="true" />}
            onClick={() => setDialog({})}
            className="min-w-touch"
          >
            Nova meta
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className={GRID} aria-busy="true" aria-label="Carregando metas">
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-40" />
        </div>
      ) : isError ? (
        <Panel>
          <WidgetError
            message="Não foi possível carregar as metas."
            onRetry={() => void refetch()}
          />
        </Panel>
      ) : (
        <div className="col gap-4">
          {active.length === 0 ? (
            <EmptyState
              icon={Goal}
              title="Nenhuma meta ainda"
              desc="Defina quanto quer juntar, vincule a uma conta ou aplicação e acompanhe quanto falta."
              action={
                <Button variant="primary" onClick={() => setDialog({})}>
                  Criar meta
                </Button>
              }
            />
          ) : (
            <ul className={GRID} aria-label="Metas ativas">
              {active.map((goal) => (
                <li key={goal.id}>
                  <GoalCard
                    goal={goal}
                    linkLabel={linkLabel(goal)}
                    onEdit={(selected) => setDialog({ goal: selected })}
                  />
                </li>
              ))}
            </ul>
          )}

          {archived.length > 0 && (
            <section className="col gap-3">
              <Button
                variant="ghost"
                className="self-start"
                aria-expanded={showArchived}
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived ? 'Ocultar arquivadas' : `Ver arquivadas (${archived.length})`}
              </Button>
              {showArchived && (
                <ul className={GRID} aria-label="Metas arquivadas">
                  {archived.map((goal) => (
                    <li key={goal.id}>
                      <GoalCard
                        goal={goal}
                        linkLabel={linkLabel(goal)}
                        onUnarchive={(selected) => unarchive(selected.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      <GoalDialog state={dialog} onClose={() => setDialog(null)} />
    </div>
  )
}
