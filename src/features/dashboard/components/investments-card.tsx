import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { ROUTES } from '@/app/router/routes'
import { formatShortDate } from '@/lib/format-date'
import type { InvestmentSummary } from '@/features/investments/types'
import { toNumber } from '@/features/investments/utils/labels'
import { Amount } from './amount'
import { Panel, PanelHeader } from './panel'

interface InvestmentsCardProps {
  summary: InvestmentSummary
  /** Do overview: quanto o bruto andou desde o fim do mês anterior. */
  yieldMonth: number
  className?: string
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-caption text-fg-muted">{label}</span>
      <Amount
        value={value}
        signed={tone !== undefined}
        className={`font-display text-[17px] font-bold leading-none ${tone ?? 'text-fg'}`}
      />
    </div>
  )
}

/** Resumo da renda fixa ao lado da projeção; o detalhe fica na página de investimentos. */
export function InvestmentsCard({ summary, yieldMonth, className = '' }: InvestmentsCardProps) {
  const next = summary.upcomingMaturities[0]

  return (
    <Panel className={className} label="Investimentos">
      <PanelHeader
        title="Investimentos"
        sub={summary.estimated ? 'Renda fixa · inclui estimativa' : 'Renda fixa, valor de hoje'}
        right={
          <Link
            to={ROUTES.INVESTMENTS}
            className="inline-flex min-h-touch items-center px-1 text-body-sm font-semibold text-brand-text no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
          >
            Ver investimentos
          </Link>
        }
      />
      <div className="mb-3 grid grid-cols-3 gap-3 xl:grid-cols-2">
        <Stat label="Valor bruto" value={toNumber(summary.totalGross)} />
        <Stat label="Líquido se resgatar" value={toNumber(summary.totalNet)} />
        <Stat
          label="Rendeu no mês"
          value={yieldMonth}
          tone={yieldMonth < 0 ? 'text-expense' : 'text-income'}
        />
      </div>
      <div className="mt-auto flex items-center gap-3 rounded-xl bg-surface-2 p-3 text-caption">
        <CalendarClock size={16} className="flex-none text-fg-muted" aria-hidden="true" />
        {next ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-fg">{next.name}</span>
            <span className="text-fg-muted">
              vence {formatShortDate(next.maturityDate)} · <Amount value={toNumber(next.net)} />{' '}
              líquido
            </span>
          </span>
        ) : (
          <span className="text-fg-muted">Nenhum vencimento nos próximos 90 dias.</span>
        )}
      </div>
    </Panel>
  )
}
