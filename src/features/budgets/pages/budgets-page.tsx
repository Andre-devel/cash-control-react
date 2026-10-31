import { useMemo, useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { BudgetBar } from '@/features/budgets/components/budget-bar'
import { BudgetDialog, type BudgetDialogState } from '@/features/budgets/components/budget-dialog'
import { BudgetRow } from '@/features/budgets/components/budget-row'
import { useBudgetProgress } from '@/features/budgets/hooks/use-budgets'
import { pacePercent } from '@/features/budgets/utils/budget-tone'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { buildCategoryGroups } from '@/features/categories/utils/category-groups'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import { Amount } from '@/features/dashboard/components/amount'
import { MonthStepper } from '@/features/dashboard/components/month-picker'
import {
  Panel,
  PanelHeader,
  SkeletonBlock,
  WidgetError,
} from '@/features/dashboard/components/panel'
import { shiftYearMonth, toYearMonth } from '@/features/dashboard/utils'

/** Meses no seletor: os 6 anteriores para conferir e os 3 seguintes para planejar. */
const PAST_MONTHS = 6
const FUTURE_MONTHS = 3

function Stat({ label, value, tone = 'text-fg' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-caption text-fg-muted">{label}</span>
      <Amount value={value} className={`font-display text-[17px] font-bold leading-none ${tone}`} />
    </div>
  )
}

export default function BudgetsPage() {
  const currentKey = toYearMonth(new Date())
  const monthOptions = Array.from({ length: PAST_MONTHS + FUTURE_MONTHS + 1 }, (_, i) =>
    shiftYearMonth(currentKey, i - PAST_MONTHS),
  )
  const [month, setMonth] = useState(currentKey)
  const [dialog, setDialog] = useState<BudgetDialogState>(null)
  const { data, isLoading, isError, refetch } = useBudgetProgress(month)
  const { data: categories } = useCategories()

  const items = useMemo(() => data?.items ?? [], [data])
  const names = useMemo(
    () => new Map(flattenCategories(categories ?? []).map((c) => [c.id, c.name])),
    [categories],
  )
  // O select do "novo orçamento" só oferece categorias que ainda não têm teto neste mês.
  const availableGroups = useMemo(() => {
    const budgeted = new Set(items.map((i) => i.categoryId))
    // Sem `subcategories`: buildCategoryGroups achataria de novo e traria as filhas já filtradas.
    const offered = flattenCategories(categories ?? [])
      .filter((c) => !c.isArchived && !budgeted.has(c.id))
      .map((c) => ({ ...c, subcategories: undefined }))
    return buildCategoryGroups(offered)
  }, [categories, items])

  const pace = data ? pacePercent(data.dayOfMonth, data.daysInMonth) : null
  const available = data ? data.totalBudget - data.totalSpent : 0

  return (
    <div>
      <div className="page-h">
        <div>
          <h1 className="title">Orçamentos</h1>
          <div className="desc">Teto de gasto por categoria, contado pelo mês da compra.</div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <MonthStepper
            options={monthOptions}
            value={month}
            onChange={setMonth}
            label="Mês do orçamento"
          />
          <Button
            variant="primary"
            leading={<Plus size={16} aria-hidden="true" />}
            onClick={() => setDialog({})}
            aria-label="Novo orçamento"
            className="min-w-touch"
          >
            <span className="hidden md:inline">Novo orçamento</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="col gap-3" aria-busy="true" aria-label="Carregando orçamentos">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-48" />
        </div>
      ) : isError || !data ? (
        <Panel>
          <WidgetError
            message="Não foi possível carregar os orçamentos."
            onRetry={() => void refetch()}
          />
        </Panel>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhum orçamento ainda"
          desc="Defina quanto quer gastar por mês em cada categoria e acompanhe o quanto já foi usado."
          action={
            <Button variant="primary" onClick={() => setDialog({})}>
              Criar orçamento
            </Button>
          }
        />
      ) : (
        <div className="col gap-4">
          <Panel label="Resumo do orçamento">
            <div className="mb-3 grid grid-cols-3 gap-3">
              <Stat label="Orçado" value={data.totalBudget} />
              <Stat label="Gasto" value={data.totalSpent} />
              <Stat
                label={available < 0 ? 'Passou' : 'Disponível'}
                value={Math.abs(available)}
                tone={available < 0 ? 'text-expense' : 'text-income'}
              />
            </div>
            <BudgetBar
              budget={data.totalBudget}
              spent={data.totalSpent}
              forecast={data.totalForecast}
              pace={pace}
            />
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-caption text-fg-muted">
              {data.totalForecast > 0 ? (
                <span>
                  + <Amount value={data.totalForecast} /> em contas a vencer no mês
                </span>
              ) : (
                <span />
              )}
              {pace !== null && <span>Marca: onde o gasto estaria no ritmo do mês</span>}
            </div>
            {data.uncategorizedSpent > 0 && (
              <p className="mt-3 rounded-xl bg-surface-2 p-3 text-caption text-fg-muted">
                <Amount value={data.uncategorizedSpent} /> gastos sem categoria neste mês não entram
                em nenhum orçamento.
              </p>
            )}
          </Panel>

          <Panel label="Categorias">
            <PanelHeader title="Categorias" sub="Toque para mudar o teto" />
            <ul className="col gap-1">
              {items.map((item) => (
                <li key={item.categoryId}>
                  <BudgetRow
                    item={item}
                    parentName={item.parentId ? names.get(item.parentId) : undefined}
                    pace={pace}
                    onSelect={(selected) => setDialog({ item: selected })}
                  />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      <BudgetDialog
        state={dialog}
        month={month}
        groups={availableGroups}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}
