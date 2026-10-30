import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import { useHideValues } from '@/lib/hide-values'
import { useHoldingEvolution } from '@/features/investments/hooks/use-investments'
import type { FixedIncomeHolding } from '@/features/investments/types'
import {
  KIND_LABELS,
  formatPercent,
  rateLabel,
  toNumber,
} from '@/features/investments/utils/labels'
import { formatLocalDate } from '@/lib/format-date'
import { formatChartMoney, formatCompactNumber } from '@/lib/money'

const AXIS_TICK = { fontSize: 11, fill: 'var(--text-muted)' }
const HIDDEN = 'R$ ••••'

interface HoldingDetailDialogProps {
  holding: FixedIncomeHolding | null
  onClose: () => void
}

export function HoldingDetailDialog({ holding, onClose }: HoldingDetailDialogProps) {
  const { hidden } = useHideValues()
  const { data, isLoading, isError } = useHoldingEvolution(holding?.id ?? null)
  if (!holding) return null

  const points = (data?.points ?? []).map((point) => ({
    date: point.date,
    Aplicação: toNumber(point.gross),
    '100% do CDI': toNumber(point.cdiBenchmark),
  }))
  const valuation = holding.valuation

  return (
    <Modal
      title={holding.name}
      subtitle={`${KIND_LABELS[holding.kind]} · ${rateLabel(holding)}`}
      onClose={onClose}
      wide
    >
      <div className="col gap-5">
        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-2 text-body-sm md:grid-cols-4">
          <div>
            <dt className="text-fg-muted">Aplicado em</dt>
            <dd className="m-0 text-fg">{formatLocalDate(holding.appliedAt)}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Vencimento</dt>
            <dd className="m-0 text-fg">
              {holding.maturityDate ? formatLocalDate(holding.maturityDate) : 'Liquidez diária'}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Conta</dt>
            <dd className="m-0 text-fg">{holding.accountName}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Rentabilidade</dt>
            <dd className="m-0 text-fg">
              {formatPercent(holding.yieldPercent)}
              {holding.cdiPercent !== null && ` · ${formatPercent(holding.cdiPercent, 1)} do CDI`}
            </dd>
          </div>
          {valuation && (
            <>
              <div>
                <dt className="text-fg-muted">Bruto</dt>
                <dd className="m-0 tabular-nums">
                  <Money value={toNumber(valuation.gross)} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">IR ({formatPercent(valuation.incomeTaxRate, 1)})</dt>
                <dd className="m-0 tabular-nums">
                  <Money value={toNumber(valuation.incomeTax)} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">IOF</dt>
                <dd className="m-0 tabular-nums">
                  <Money value={toNumber(valuation.iof)} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Líquido hoje</dt>
                <dd className="m-0 font-semibold tabular-nums">
                  <Money value={toNumber(valuation.net)} />
                </dd>
              </div>
            </>
          )}
        </dl>

        <section aria-label="Evolução da aplicação">
          <h3 className="mb-2 font-display text-body font-semibold text-fg">Evolução</h3>
          {isLoading ? (
            <div
              className="h-[200px] rounded-md bg-surface-3 motion-safe:animate-pulse"
              aria-busy="true"
            />
          ) : isError ? (
            <p className="text-body-sm text-expense">Erro ao carregar a evolução.</p>
          ) : points.length < 2 ? (
            <p className="text-body-sm text-fg-muted">
              A evolução aparece a partir do primeiro mês.
            </p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatLocalDate}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={hidden ? 8 : 60}
                    domain={['auto', 'auto']}
                    tickFormatter={(v: number) => (hidden ? '' : formatCompactNumber(v))}
                  />
                  <Tooltip
                    labelFormatter={(label) => formatLocalDate(String(label))}
                    formatter={(v) => (hidden ? HIDDEN : formatChartMoney(v))}
                    contentStyle={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="Aplicação"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="100% do CDI"
                    stroke="var(--text-muted)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {holding.redemptions.length > 0 && (
          <section aria-label="Resgates">
            <h3 className="mb-2 font-display text-body font-semibold text-fg">Resgates</h3>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {holding.redemptions.map((redemption) => (
                <li
                  key={redemption.id}
                  className="flex items-center justify-between gap-3 text-body-sm"
                >
                  <span className="text-fg-muted">{formatLocalDate(redemption.redeemedAt)}</span>
                  <span className="text-fg-muted">
                    bruto <Money value={toNumber(redemption.gross)} /> · IR{' '}
                    <Money value={toNumber(redemption.incomeTax)} />
                  </span>
                  <span className="font-semibold tabular-nums">
                    <Money value={toNumber(redemption.net)} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {holding.notes && <p className="text-body-sm text-fg-muted">{holding.notes}</p>}
      </div>
    </Modal>
  )
}
