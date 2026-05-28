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
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 10
  const inner = r - 22
  const strokeW = size / 2 - inner
  const C = 2 * Math.PI * r
  let offset = 0

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
      aria-label="Gráfico de distribuição"
      role="img"
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={strokeW} />
      {total > 0 &&
        segments.map((s, i) => {
          const len = (s.value / total) * C
          const dashOffset = -offset
          const circle = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeW}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          )
          offset += len
          return circle
        })}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontSize="10"
        fill="var(--text-dim)"
        fontFamily="var(--font-mono)"
      >
        PATRIMÔNIO
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontSize="16"
        fill="var(--text)"
        fontFamily="var(--font-mono)"
        fontWeight="500"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        R$ {(total / 1000).toFixed(1).replace('.', ',')}k
      </text>
    </svg>
  )
}
