import { useMonthlyChart } from '@/features/dashboard/hooks/use-monthly-chart'
import { formatCompactNumber } from '@/lib/money'

/** Janelas do gráfico. Os cards de resumo são sempre do mês corrente. */
const MONTH_OPTIONS = [3, 6, 12] as const

const MONTH_ABBR_PT: Record<string, string> = {
  '01': 'jan',
  '02': 'fev',
  '03': 'mar',
  '04': 'abr',
  '05': 'mai',
  '06': 'jun',
  '07': 'jul',
  '08': 'ago',
  '09': 'set',
  '10': 'out',
  '11': 'nov',
  '12': 'dez',
}

function ChartSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{ height: 280, background: 'var(--surface-2)', borderRadius: 8 }}
      aria-busy="true"
      aria-label="Carregando gráfico"
    />
  )
}

interface BarChartCardProps {
  months?: number
  onMonthsChange?: (months: number) => void
}

function signedCompactMoney(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}R$ ${formatCompactNumber(Math.abs(value))}`
}

export function BarChartCard({ months = 6, onMonthsChange }: BarChartCardProps) {
  const { data, isLoading, isError } = useMonthlyChart(months)

  const W = 620,
    H = 280,
    PAD_L = 56,
    PAD_R = 12,
    PAD_T = 20,
    PAD_B = 32
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  const entries = data?.months ?? []
  const parsed = entries.map((e) => ({
    m: MONTH_ABBR_PT[e.month.slice(5, 7)] ?? e.month.slice(5, 7),
    income: parseFloat(e.income),
    expense: parseFloat(e.expenses),
  }))

  const allValues = parsed.flatMap((d) => [d.income, d.expense])
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0
  const max = Math.max(maxValue * 1.12, 1)

  const groupW = parsed.length > 0 ? chartW / parsed.length : chartW
  const barW = groupW * 0.3
  const gap = 4
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((p) => max * p)

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Receitas vs Despesas</h3>
          <div className="sub">Últimos {months} meses · saldo do mês atual em destaque</div>
        </div>
        <div className="right">
          <span className="legend">
            <span className="sw" style={{ background: 'var(--income)' }} />
            Receitas
          </span>
          <span className="legend">
            <span className="sw" style={{ background: 'var(--expense)' }} />
            Despesas
          </span>
          {onMonthsChange && (
            <div className="tabs" role="tablist" aria-label="Período do gráfico">
              {MONTH_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={months === option}
                  className={months === option ? 'on' : ''}
                  onClick={() => onMonthsChange(option)}
                >
                  {option}m
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card-b" style={{ padding: 12 }}>
        {isLoading ? (
          <ChartSkeleton />
        ) : isError ? (
          <div role="alert" style={{ padding: 16, color: 'var(--expense)', fontSize: 13 }}>
            Erro ao carregar gráfico.
          </div>
        ) : parsed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontSize: 13 }}>
            Sem dados disponíveis.
          </div>
        ) : (
          /* O SVG tem proporção fixa (620 × 280): sem o wrapper rolável ele encolhia
             junto com a largura no celular, chegando a ~120 px de altura e rótulos de
             eixo ilegíveis. Ver `.chart-scroll` em globals.css. */
          <div className="chart-scroll">
            <svg
              className="bar-chart"
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Gráfico de receitas vs despesas"
            >
              {gridYs.map((v, i) => {
                const y = PAD_T + chartH - (v / max) * chartH
                return (
                  <g key={i}>
                    <line className="gridline" x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} />
                    <text className="axis" x={PAD_L - 8} y={y + 3} textAnchor="end">
                      {formatCompactNumber(v)}
                    </text>
                  </g>
                )
              })}
              {parsed.map((d, i) => {
                const x0 = PAD_L + i * groupW + groupW / 2
                const incH = (d.income / max) * chartH
                const expH = (d.expense / max) * chartH
                const ix = x0 - barW - gap / 2
                const ex = x0 + gap / 2
                const iy = PAD_T + chartH - incH
                const ey = PAD_T + chartH - expH
                const isCurrent = i === parsed.length - 1
                const diff = d.income - d.expense
                const diffLabel = signedCompactMoney(diff)
                // O destaque fica sobre a barra do mês atual, a última: sem o limite ele
                // passava da borda direita do SVG e o valor aparecia cortado.
                const labelX = Math.min(x0 - 52, W - 106)

                return (
                  <g key={i}>
                    <rect
                      className="bar-income"
                      x={ix}
                      y={iy}
                      width={barW}
                      height={incH}
                      rx="3"
                      opacity={isCurrent ? 1 : 0.85}
                    />
                    <rect
                      className="bar-expense"
                      x={ex}
                      y={ey}
                      width={barW}
                      height={expH}
                      rx="3"
                      opacity={isCurrent ? 1 : 0.85}
                    />
                    <text
                      className="axis"
                      x={x0}
                      y={H - 10}
                      textAnchor="middle"
                      style={{
                        fontWeight: isCurrent ? 600 : 400,
                        fill: isCurrent ? 'var(--text)' : 'var(--text-faint)',
                      }}
                    >
                      {d.m}
                    </text>
                    {isCurrent && incH > 4 && (
                      <g>
                        <rect
                          x={labelX}
                          y={iy - 34}
                          width="104"
                          height="26"
                          rx="6"
                          fill="var(--surface-3)"
                          stroke="var(--border-strong)"
                        />
                        <text
                          x={labelX + 52}
                          y={iy - 16}
                          textAnchor="middle"
                          fontSize="11"
                          fill="var(--text)"
                          fontFamily="var(--font-mono)"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {diffLabel}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
