import { Money } from '@/components/ui/money'
import { LIMIT_TONE_TEXT, limitTone, type LimitView } from '@/features/cards/utils/limit-view'
import '@/features/cards/cards.css'

const TONE_CLASS = { ok: '', warn: ' warn', over: ' over' } as const
/** Cor-base dos segmentos, na mesma faixa de alerta da barra simples. */
const TONE_VAR = {
  ok: '--cc-brand',
  warn: '--cc-pending-solid',
  over: '--cc-overdue-solid',
} as const

/** Opacidades dos segmentos do grupo: o primeiro cartão cheio, os outros mais claros. */
const SEGMENT_ALPHA = [1, 0.55, 0.35, 0.22]

interface LimitUsageBarProps {
  view: LimitView
  /** Rótulo da barra. O padrão segue o design: "Limite usado" / "Limite compartilhado". */
  label?: string
  /** Mostra a legenda por cartão do grupo (detalhe do cartão). */
  showSegments?: boolean
  /** Texto do percentual; por padrão "N%" com o aviso de perto do limite. */
  pctText?: string
  /** Esconde a linha de rótulo/percentual quando quem envolve já mostra o número. */
  showHeader?: boolean
}

/**
 * Barra de limite usado/disponível com as faixas de alerta: ≥ 85% `pending` (`.bar.warn`),
 * ≥ 100% `overdue-solid` (`.bar.over`). Num grupo de limite compartilhado, a barra soma o
 * uso do grupo e, com `showSegments`, separa a fatia de cada cartão.
 */
export function LimitUsageBar({
  view,
  label,
  showSegments = false,
  pctText,
  showHeader = true,
}: LimitUsageBarProps) {
  const tone = limitTone(view.pct)
  const pctRounded = Math.round(view.pct)
  const width = Math.min(100, Math.max(0, view.pct))
  const segmented = showSegments && view.shared && view.segments.length > 1
  const title = label ?? (view.shared ? 'Limite compartilhado' : 'Limite usado')
  const pctLabel =
    pctText ??
    `${pctRounded}%${tone === 'over' ? ' · limite estourado' : tone === 'warn' ? ' · perto do limite' : ''}`

  return (
    <div className="flex flex-col gap-2">
      {showHeader && (
        <div className="flex items-baseline justify-between gap-2 text-body-sm font-medium">
          <span>{title}</span>
          <span className={`tabular-nums ${LIMIT_TONE_TEXT[tone]}`}>{pctLabel}</span>
        </div>
      )}

      {segmented ? (
        <div
          className="cc-limit-segments"
          role="progressbar"
          aria-label={title}
          aria-valuenow={pctRounded}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {view.segments.map((segment, i) => (
            <i
              key={segment.cardId}
              style={{
                width: view.limit > 0 ? `${(segment.used / view.limit) * 100}%` : 0,
                background: `rgb(var(${TONE_VAR[tone]}) / ${SEGMENT_ALPHA[i] ?? 0.2})`,
              }}
            />
          ))}
        </div>
      ) : (
        <div
          className={`bar h-2.5${TONE_CLASS[tone]}`}
          role="progressbar"
          aria-label={title}
          aria-valuenow={pctRounded}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i style={{ width: `${width}%` }} />
        </div>
      )}

      {segmented ? (
        <ul className="flex flex-col gap-1.5 text-body-sm tabular-nums">
          {view.segments.map((segment, i) => (
            <li key={segment.cardId} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ background: `rgb(var(${TONE_VAR[tone]}) / ${SEGMENT_ALPHA[i] ?? 0.2})` }}
              />
              <span className="min-w-0 flex-1 truncate">{segment.name}</span>
              <Money value={segment.used} />
            </li>
          ))}
          <li className="flex items-center gap-2 text-fg-muted">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-[2px] bg-surface-3" />
            <span className="flex-1">Disponível</span>
            <span>
              <Money value={view.available} /> de <Money value={view.limit} />
            </span>
          </li>
        </ul>
      ) : (
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-caption text-fg-muted tabular-nums">
          <span>
            <Money value={view.used} /> de <Money value={view.limit} />
          </span>
          <span>
            <Money value={view.available} /> livres
          </span>
        </div>
      )}
    </div>
  )
}
