import { CategoryBubble } from '@/features/categories/components/category-bubble'
import { Amount } from '@/features/dashboard/components/amount'
import type { BudgetItem } from '@/features/budgets/types'
import { TONE_TEXT, budgetTone } from '@/features/budgets/utils/budget-tone'
import { BudgetBar } from './budget-bar'

interface BudgetRowProps {
  item: BudgetItem
  /** Nome da categoria pai, para a subcategoria aparecer como "Pai › Filha". */
  parentName?: string
  pace: number | null
  onSelect?: (item: BudgetItem) => void
  /** Versão do card do dashboard: sem previsto e sem o selo de ajuste. */
  compact?: boolean
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

export function BudgetRow({ item, parentName, pace, onSelect, compact = false }: BudgetRowProps) {
  const tone = budgetTone(item.percent)
  const over = item.remaining < 0

  const content = (
    <>
      <div className="flex items-center gap-3">
        <CategoryBubble color={item.color} icon={item.icon} size={compact ? 'sm' : 'md'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-body-sm font-semibold text-fg">
              {parentName && <span className="font-normal text-fg-muted">{parentName} › </span>}
              {item.name}
            </span>
            <span
              className={`flex-none text-caption font-semibold tabular-nums ${TONE_TEXT[tone]}`}
            >
              {Math.round(item.percent)}%
            </span>
          </div>
          <div className="text-caption text-fg-muted">
            <Amount value={item.spent} /> de <Amount value={item.budget} />
            {!compact && item.source === 'MONTH' && (
              <span className="ml-2 rounded-full bg-info-soft px-2 py-0.5 text-info">
                só neste mês
              </span>
            )}
          </div>
        </div>
      </div>
      <BudgetBar
        className="mt-2"
        budget={item.budget}
        spent={item.spent}
        forecast={compact ? 0 : item.forecast}
        pace={pace}
      />
      <div className="mt-1 flex justify-between gap-2 text-caption">
        <span className={over ? 'text-expense' : 'text-fg-muted'}>
          {over ? 'Passou ' : 'Falta '}
          <Amount value={Math.abs(item.remaining)} />
        </span>
        {!compact && item.forecast > 0 && (
          <span className="text-fg-muted">
            + <Amount value={item.forecast} /> previsto
          </span>
        )}
      </div>
    </>
  )

  if (!onSelect) return <div className="py-2">{content}</div>

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`block w-full rounded-xl px-2 py-3 text-left hover:bg-surface-2 ${FOCUS}`}
    >
      {content}
    </button>
  )
}
