import { useState, type FormEvent } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import {
  useCardReconciliation,
  useReconcileCard,
} from '@/features/cards/hooks/use-card-reconciliation'
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

/** Descrição sugerida do lançamento da diferença; o usuário pode editar antes de enviar. */
export const DEFAULT_CARD_ADJUSTMENT_DESCRIPTION = 'IOF e tarifas'

interface CardBankReconciliationProps {
  cardId: string
}

/**
 * Limite e disponível que o banco informou na última leitura, ao lado do uso calculado no app.
 * Some quando o cartão não está vinculado ou o banco não informou limite. Com a fatura do banco
 * acima da do app, "Lançar diferença" cria uma despesa avulsa na fatura aberta — sempre por
 * clique do usuário, com descrição editável.
 */
export function CardBankReconciliation({ cardId }: CardBankReconciliationProps) {
  const { data } = useCardReconciliation(cardId)
  const { mutate: reconcile, isPending } = useReconcileCard()
  const [formOpen, setFormOpen] = useState(false)
  const [description, setDescription] = useState(DEFAULT_CARD_ADJUSTMENT_DESCRIPTION)

  if (!data || data.bankLimit === null || data.bankAvailable === null) return null

  const difference = Number(data.difference ?? 0)

  function openForm() {
    setDescription(DEFAULT_CARD_ADJUSTMENT_DESCRIPTION)
    setFormOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    reconcile(
      {
        cardId,
        data: {
          amount: difference.toFixed(2),
          description: description.trim() || undefined,
        },
      },
      { onSuccess: () => setFormOpen(false) },
    )
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <dl className="m-0 grid grid-cols-2 gap-3 text-body-sm tabular-nums">
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption text-fg-muted">Limite no banco</dt>
          <dd className="m-0 font-medium">
            <Money value={Number(data.bankLimit)} />
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption text-fg-muted">Disponível no banco</dt>
          <dd className="m-0 font-medium">
            <Money value={Number(data.bankAvailable)} />
          </dd>
        </div>
      </dl>

      {difference !== 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 flex items-center gap-1.5 text-caption font-medium text-pending">
            <AlertTriangle size={14} aria-hidden="true" />
            <span>
              A fatura no banco está <Money value={Math.abs(difference)} />{' '}
              {difference > 0 ? 'acima' : 'abaixo'}
            </span>
          </p>
          {/* Só a falta no app vira lançamento: a API aceita apenas valor positivo. */}
          {difference > 0 && (
            <Button size="sm" onClick={openForm}>
              Lançar diferença
            </Button>
          )}
        </div>
      )}

      {formOpen && (
        <Modal
          title="Lançar diferença"
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <div className="spacer" />
              <Button
                type="submit"
                form="card-reconcile-form"
                variant="primary"
                loading={isPending}
              >
                {isPending ? 'Lançando…' : 'Lançar'}
              </Button>
            </>
          }
        >
          <form id="card-reconcile-form" onSubmit={handleSubmit} noValidate className="col gap-4">
            <p className="m-0 text-body-sm">
              Cria uma despesa de <Money value={difference} /> na fatura aberta para o cartão bater
              com o banco.
            </p>
            <Field label="Descrição">
              <Input
                value={description}
                maxLength={255}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  )
}
