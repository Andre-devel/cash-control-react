import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import type { SavingsGoal } from '@/features/goals/types'
import { Amount } from './amount'

const TILE =
  'flex min-w-0 flex-col gap-1.5 rounded-2xl border border-border bg-surface-1 p-3.5 text-fg no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus'

interface MobileShortcutsProps {
  /** Sem conta de investimento, o bloco some e Análises ocupa a linha. */
  investments?: { gross: number; yieldMonth: number }
  /** Metas ativas; `undefined` enquanto carrega. Sem nenhuma, o atalho convida a criar. */
  goals?: SavingsGoal[]
}

/** Celular: investimentos, metas e gráficos viram destinos em vez de blocos no Início. */
export function MobileShortcuts({ investments, goals }: MobileShortcutsProps) {
  const first = goals?.[0]
  return (
    <nav aria-label="Atalhos" className="grid grid-cols-2 gap-2.5">
      {investments && (
        <Link to={ROUTES.INVESTMENTS} className={TILE}>
          <span className="text-caption text-fg-muted">Investimentos</span>
          <Amount value={investments.gross} className="text-[0.9375rem] font-bold" />
          <span
            className={`text-caption font-medium ${investments.yieldMonth < 0 ? 'text-expense' : 'text-income'}`}
          >
            <Amount value={investments.yieldMonth} signed /> no mês
          </span>
        </Link>
      )}
      <Link to={ROUTES.GOALS} className={TILE}>
        <span className="text-caption text-fg-muted">Metas</span>
        {first ? (
          <>
            <span className="truncate text-[0.9375rem] font-bold">{first.name}</span>
            <span className="text-caption font-medium text-brand-text">
              {Math.round(Math.max(first.percent, 0))}%
              {goals.length > 1 ? ` · +${goals.length - 1}` : ''}
            </span>
          </>
        ) : (
          <>
            <span className="text-[0.9375rem] font-bold">Juntar dinheiro</span>
            <span className="text-caption font-medium text-brand-text">Criar meta →</span>
          </>
        )}
      </Link>
      <Link to={ROUTES.ANALYTICS} className={`${TILE} ${investments ? 'col-span-2' : ''}`}>
        <span className="text-caption text-fg-muted">Análises</span>
        <span className="text-[0.9375rem] font-bold">Gráficos do mês</span>
        <span className="text-caption font-medium text-brand-text">Abrir →</span>
      </Link>
    </nav>
  )
}
