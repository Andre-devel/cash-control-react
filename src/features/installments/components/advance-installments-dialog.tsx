import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Money } from '@/components/ui/money'
import { MoneyInput } from '@/components/ui/money-input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { normalizeMoneyInput } from '@/lib/money'
import { useAdvanceInstallments } from '@/features/installments/hooks/use-advance-installments'
import { useInstallmentSeriesDetail } from '@/features/installments/hooks/use-installment-series-detail'
import type { InstallmentSeries } from '@/features/installments/types'
import { formatLocalDate } from '@/lib/format-date'

interface AdvanceInstallmentsDialogProps {
  series: InstallmentSeries | null
  open: boolean
  onClose: () => void
}

export function AdvanceInstallmentsDialog({
  series,
  open,
  onClose,
}: AdvanceInstallmentsDialogProps) {
  const { mutate: advanceInstallments, isPending } = useAdvanceInstallments()
  const { data: detail, isLoading: loadingDetail } = useInstallmentSeriesDetail(
    open ? series?.id : null,
  )

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [newPaymentDate, setNewPaymentDate] = useState('')
  const [adjustedAmount, setAdjustedAmount] = useState('')
  const [dateError, setDateError] = useState('')
  const [selectionError, setSelectionError] = useState('')

  const pendingTransactions = detail?.installments.filter((t) => t.status === 'PENDING') ?? []

  function toggleId(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setSelectionError('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    let valid = true
    if (selectedIds.length === 0) {
      setSelectionError('Selecione pelo menos uma parcela para antecipar.')
      valid = false
    }
    if (!newPaymentDate) {
      setDateError('Nova data é obrigatória.')
      valid = false
    }
    if (!valid) return

    advanceInstallments(
      {
        installmentIds: selectedIds,
        newPaymentDate,
        adjustedAmount: adjustedAmount ? normalizeMoneyInput(adjustedAmount) : undefined,
      },
      {
        onSuccess: () => {
          setSelectedIds([])
          setNewPaymentDate('')
          setAdjustedAmount('')
          setDateError('')
          setSelectionError('')
          onClose()
        },
      },
    )
  }

  function handleClose() {
    setSelectedIds([])
    setNewPaymentDate('')
    setAdjustedAmount('')
    setDateError('')
    setSelectionError('')
    onClose()
  }

  if (!open) return null

  const selected = pendingTransactions.filter((t) => selectedIds.includes(t.id))
  const selectedTotal = selected.reduce((sum, t) => sum + parseFloat(t.amount), 0)

  return (
    <Modal
      title="Antecipar parcelas"
      subtitle={
        series
          ? `${series.description}${detail ? ` · ${pendingTransactions.length} em aberto` : ''}`
          : undefined
      }
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="advance-installments-form"
            variant="primary"
            disabled={loadingDetail}
            loading={isPending}
          >
            {isPending ? 'Antecipando…' : 'Antecipar parcelas'}
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-fg-muted">
        Mover as parcelas selecionadas de <strong className="text-fg">{series?.description}</strong>{' '}
        para uma nova data de vencimento.
      </p>

      <form
        id="advance-installments-form"
        onSubmit={handleSubmit}
        noValidate
        className="mt-3 flex flex-col gap-4"
      >
        {loadingDetail ? (
          <div className="flex flex-col gap-1.5" aria-label="Carregando parcelas" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[52px] animate-pulse rounded-md bg-surface-3 motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : pendingTransactions.length === 0 ? (
          <p className="text-body-sm text-fg-muted">Nenhuma parcela pendente para antecipar.</p>
        ) : (
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2 text-body-sm font-semibold text-fg">
              Selecionar parcelas para antecipar
            </legend>
            {selectionError && (
              <p className="mb-2 text-caption text-overdue" role="alert">
                {selectionError}
              </p>
            )}
            <div className="flex max-h-[40dvh] flex-col gap-1.5 overflow-y-auto">
              {pendingTransactions.map((t) => {
                const checked = selectedIds.includes(t.id)
                return (
                  <label
                    key={t.id}
                    className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-md border px-3 text-body-sm transition-colors focus-within:ring-2 focus-within:ring-focus ${
                      checked ? 'border-brand bg-brand/10' : 'border-border hover:bg-surface-2'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={checked}
                      onChange={() => toggleId(t.id)}
                      aria-label={`Parcela ${t.installmentNumber}: ${formatLocalDate(t.competenceDate)}`}
                    />
                    <span className="w-11 font-mono text-caption font-semibold">
                      {t.installmentNumber ? `#${t.installmentNumber}` : '—'}
                    </span>
                    <span className="flex-1 text-fg-muted">
                      vence {formatLocalDate(t.competenceDate)}
                    </span>
                    <span className="font-semibold tabular-nums text-fg">
                      <Money value={parseFloat(t.amount)} />
                    </span>
                  </label>
                )
              })}
            </div>
            {selected.length > 0 && (
              <p className="mt-2 text-caption text-fg-muted" aria-live="polite">
                {selected.length}{' '}
                {selected.length === 1 ? 'parcela selecionada' : 'parcelas selecionadas'} ·{' '}
                <Money value={selectedTotal} />
              </p>
            )}
          </fieldset>
        )}

        <Field label="Nova data de vencimento" error={dateError}>
          <Input
            type="date"
            value={newPaymentDate}
            onChange={(e) => {
              setNewPaymentDate(e.target.value)
              setDateError('')
            }}
            aria-label="Nova data de vencimento"
          />
        </Field>

        <Field
          label="Novo valor por parcela (opcional)"
          hint="Com desconto pela antecipação, informe o valor de cada parcela."
        >
          <MoneyInput
            type="text"
            placeholder="ex: 350,00"
            value={adjustedAmount}
            onChange={(e) => setAdjustedAmount(e.target.value)}
            aria-label="Novo valor por parcela"
          />
        </Field>
      </form>
    </Modal>
  )
}
