import { formatCompactNumber } from '@/lib/money'

interface DonutSegment {
  value: number
  color: string
  label: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  total: number
  size?: number
}

export function DonutChart({ segments, total, size = 160 }: DonutChartProps) {
  const stroke = Math.max(12, Math.round(size * 0.14))
  const cx = size / 2
  const cy = size / 2
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label="Gráfico de distribuição"
        role="img"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgb(var(--cc-surface-3))"
          strokeWidth={stroke}
        />
        {total > 0 &&
          segments.map((s, i) => {
            const len = (s.value / total) * C
            const dashOffset = -offset
            offset += len
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )
          })}
      </svg>
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5"
        aria-hidden="true"
      >
        <span className="text-overline uppercase text-fg-muted">Patrimônio</span>
        <span className="text-body font-bold tabular-nums text-fg">
          R$ {formatCompactNumber(total)}
        </span>
      </div>
    </div>
  )
}
