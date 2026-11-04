import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import { CategoryBubble } from '@/features/categories/components/category-bubble'
import { Amount } from '@/features/dashboard/components/amount'
import {
  Panel,
  PanelHeader,
  SkeletonBlock,
  WidgetEmpty,
  WidgetError,
} from '@/features/dashboard/components/panel'
import { monthPillLabel } from '@/features/dashboard/utils'
import { Segmented } from '@/features/investments/components/segmented'
import { useBudgetHistory } from '@/features/budgets/hooks/use-budgets'
import type { BudgetHistoryCell, BudgetHistoryItem } from '@/features/budgets/types'
import { budgetTone, type BudgetTone } from '@/features/budgets/utils/budget-tone'
import { useMediaQuery, MOBILE_QUERY } from '@/hooks/use-media-query'

export type HistoryMonths = 6 | 12

const MONTH_OPTIONS: { id: `${HistoryMonths}`; label: string }[] = [
  { id: '6', label: '6 meses' },
  { id: '12', label: '12 meses' },
]

/** O rótulo vai junto da cor: a faixa não pode depender só dela. */
const TONE_LABEL: Record<BudgetTone, string> = {
  ok: 'Dentro',
  warn: 'Perto do teto',
  over: 'Estourou',
}

const TONE_CELL: Record<BudgetTone, string> = {
  ok: 'bg-income-soft text-income',
  warn: 'bg-pending-soft text-pending',
  over: 'bg-expense-soft text-expense',
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

/**
 * Lançamentos da categoria naquele mês de competência. Compras no cartão entram, porque
 * contam no orçamento pelo mês da compra.
 */
export function historyCellHref(categoryId: string, month: string): string {
  const params = new URLSearchParams({ categoryId, period: month, includeCreditCard: 'true' })
  return `${ROUTES.TRANSACTIONS}?${params.toString()}`
}

interface HistoryCellProps {
  item: BudgetHistoryItem
  cell: BudgetHistoryCell
  onOpen: (categoryId: string, month: string) => void
  className?: string
}

function HistoryCell({ item, cell, onOpen, className = '' }: HistoryCellProps) {
  const tone = cell.percent === null ? null : budgetTone(cell.percent)
  return (
    <button
      type="button"
      data-tone={tone ?? 'none'}
      onClick={() => onOpen(item.categoryId, cell.month)}
      className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-2 py-1.5 text-left hover:brightness-110 ${
        tone ? TONE_CELL[tone] : 'bg-surface-2 text-fg-muted'
      } ${FOCUS} ${className}`}
    >
      <span className="sr-only">
        {item.name}, {monthPillLabel(cell.month)}:{' '}
      </span>
      <Amount value={cell.spent} className="text-body-sm font-semibold text-fg" />
      <span className="text-caption font-semibold">
        {tone ? `${Math.round(cell.percent ?? 0)}% · ${TONE_LABEL[tone]}` : 'Sem teto'}
      </span>
    </button>
  )
}

/**
 * Teto × gasto por categoria nos últimos meses. No desktop é uma tabela categoria × mês;
 * no celular, um cartão por categoria com os meses rolando na horizontal.
 */
export function BudgetHistory() {
  const [months, setMonths] = useState<HistoryMonths>(6)
  const navigate = useNavigate()
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const { data, isLoading, isError, refetch } = useBudgetHistory(months)

  const open = (categoryId: string, month: string) =>
    void navigate(historyCellHref(categoryId, month))

  const header = (
    <PanelHeader
      title="Histórico"
      sub="Gasto de cada mês, pelo mês da compra. Toque no mês para ver os lançamentos."
      right={
        <Segmented
          label="Período do histórico"
          options={MONTH_OPTIONS}
          value={`${months}`}
          onChange={(id) => setMonths(Number(id) as HistoryMonths)}
        />
      }
    />
  )

  if (isLoading) {
    return (
      <Panel label="Histórico do orçamento">
        {header}
        <div aria-busy="true" aria-label="Carregando histórico">
          <SkeletonBlock className="h-48" />
        </div>
      </Panel>
    )
  }

  if (isError || !data) {
    return (
      <Panel label="Histórico do orçamento">
        {header}
        <WidgetError
          message="Não foi possível carregar o histórico."
          onRetry={() => void refetch()}
        />
      </Panel>
    )
  }

  if (data.items.length === 0) {
    return (
      <Panel label="Histórico do orçamento">
        {header}
        <WidgetEmpty>Nenhuma categoria teve orçamento neste período.</WidgetEmpty>
      </Panel>
    )
  }

  if (isMobile) {
    return (
      <Panel label="Histórico do orçamento">
        {header}
        <ul className="col gap-3">
          {data.items.map((item) => (
            <li key={item.categoryId} className="rounded-xl bg-surface-2 p-3">
              <div className="mb-2 flex items-center gap-2">
                <CategoryBubble color={item.color} icon={item.icon} size="sm" />
                <span className="truncate text-body-sm font-semibold text-fg">{item.name}</span>
              </div>
              <ol className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
                {item.cells.map((cell) => (
                  <li key={cell.month} className="w-28 flex-none snap-start">
                    <span className="mb-1 block text-caption text-fg-muted" aria-hidden="true">
                      {monthPillLabel(cell.month)}
                    </span>
                    <HistoryCell item={item} cell={cell} onOpen={open} />
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </Panel>
    )
  }

  return (
    <Panel label="Histórico do orçamento">
      {header}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-left">
          <caption className="sr-only">Gasto por categoria e mês</caption>
          <thead>
            <tr>
              <th scope="col" className="px-2 text-caption font-semibold text-fg-muted">
                Categoria
              </th>
              {data.months.map((month) => (
                <th
                  key={month}
                  scope="col"
                  className="px-2 text-caption font-semibold text-fg-muted"
                >
                  {monthPillLabel(month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.categoryId}>
                <th scope="row" className="px-2 font-normal">
                  <span className="flex min-w-36 items-center gap-2">
                    <CategoryBubble color={item.color} icon={item.icon} size="sm" />
                    <span className="truncate text-body-sm font-semibold text-fg">{item.name}</span>
                  </span>
                </th>
                {item.cells.map((cell) => (
                  <td key={cell.month} className="min-w-28">
                    <HistoryCell item={item} cell={cell} onOpen={open} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
