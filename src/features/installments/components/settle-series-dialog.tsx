import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import { MoneyInput } from '@/components/ui/money-input'
import { useSettleSeries } from '@/features/installments/hooks/use-settle-series'
import { useInstallmentSeriesDetail } from '@/features/installments/hooks/use-installment-series-detail'
import {
  settleSeriesSchema,
  type SettleSeriesFormValues,
} from '@/features/installments/schemas/settle-series.schema'
import type { InstallmentSeries } from '@/features/installments/types'
import { setFormErrors } from '@/lib/form-errors'
import { localIsoDate } from '@/lib/local-date'
import { formatMoneyInput } from '@/lib/money'

interface SettleSeriesDialogProps {
  series: InstallmentSeries | null
  open: boolean
  onClose: () => void
}

export function SettleSeriesDialog({ series, open, onClose }: SettleSeriesDialogProps) {
  const { mutate: settleSeries, isPending } = useSettleSeries()
  const { data: detail } = useInstallmentSeriesDetail(open ? series?.id : null)

  // Só as parcelas em aberto entram na quitação: as pagas já saíram da conta.
  const openInstallments = (detail?.installments ?? []).filter(
    (i) => i.status === 'PENDING' || i.status === 'OVERDUE',
  )
  const outstanding = openInstallments.reduce((sum, i) => sum + parseFloat(i.amount), 0)

  const form = useForm<SettleSeriesFormValues>({
    resolver: zodResolver(settleSeriesSchema),
    defaultValues: { settlementAmount: '', settlementDate: localIsoDate() },
  })

  useEffect(() => {
    if (detail && !form.formState.dirtyFields.settlementAmount) {
      form.setValue('settlementAmount', formatMoneyInput(outstanding))
    }
  }, [detail, outstanding, form])

  function handleClose() {
    form.reset({ settlementAmount: '', settlementDate: localIsoDate() })
    onClose()
  }

  function onSubmit(data: SettleSeriesFormValues) {
    if (!series) return
    settleSeries(
      { seriesId: series.id, data },
      {
        onSuccess: handleClose,
        onError: (error) => setFormErrors(error, form.setError),
      },
    )
  }

  if (!open) return null

  return (
    <Modal
      title="Liquidar série antecipadamente"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="settle-series-form"
            variant="danger"
            disabled={!detail}
            loading={isPending}
          >
            {isPending ? 'Liquidando…' : 'Liquidar antecipadamente'}
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-fg-muted">
        Você está prestes a liquidar <strong className="text-fg">{series?.description}</strong>{' '}
        antecipadamente.
      </p>

      {series && (
        <dl className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-surface-2 px-4 py-3">
          <div className="flex flex-col gap-1">
            <dt className="text-caption text-fg-muted">Parcelas em aberto</dt>
            <dd className="m-0 text-body font-semibold tabular-nums">
              {detail ? `${openInstallments.length} de ${series.totalInstallments}` : '…'}
            </dd>
          </div>
          <div className="flex flex-col gap-1 border-l border-border pl-3">
            <dt className="text-caption text-fg-muted">Saldo devedor</dt>
            <dd className="m-0 text-body font-semibold tabular-nums">
              {detail ? <Money value={outstanding} /> : '…'}
            </dd>
          </div>
        </dl>
      )}

      <form
        id="settle-series-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="mt-4 flex flex-col gap-3"
      >
        <Field
          label="Valor da quitação"
          hint="Com desconto de juros, informe o valor efetivamente pago."
          error={form.formState.errors.settlementAmount?.message}
        >
          <MoneyInput placeholder="0,00" {...form.register('settlementAmount')} />
        </Field>
        <Field label="Data da quitação" error={form.formState.errors.settlementDate?.message}>
          <Input type="date" {...form.register('settlementDate')} />
        </Field>
        {form.formState.errors.root && (
          <p className="text-body-sm text-overdue" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}
      </form>

      <p className="mt-3 text-caption text-fg-muted">
        As parcelas em aberto serão canceladas e uma única transação de quitação será registrada.
        Esta ação não pode ser desfeita.
      </p>
    </Modal>
  )
}
