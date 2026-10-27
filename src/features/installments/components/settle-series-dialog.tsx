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
      form.setValue('settlementAmount', outstanding.toFixed(2).replace('.', ','))
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
            disabled={isPending || !detail}
            aria-busy={isPending}
          >
            {isPending ? 'Liquidando…' : 'Liquidar antecipadamente'}
          </Button>
        </>
      }
    >
      <p>
        Você está prestes a liquidar <strong>{series?.description}</strong> antecipadamente.
      </p>

      {series && (
        <div
          className="rounded space-y-1 text-sm"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface-3)',
            padding: '12px 16px',
            marginTop: 12,
          }}
        >
          <div className="flex justify-between">
            <span className="text-dim">Parcelas em aberto</span>
            <span className="font-medium">
              {detail ? `${openInstallments.length} de ${series.totalInstallments}` : '…'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">Saldo devedor</span>
            <span className="font-semibold tabular-nums">
              {detail ? <Money value={outstanding} /> : '…'}
            </span>
          </div>
        </div>
      )}

      <form
        id="settle-series-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-3"
        style={{ marginTop: 12 }}
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
          <p className="text-sm" role="alert" style={{ color: 'var(--expense)' }}>
            {form.formState.errors.root.message}
          </p>
        )}
      </form>

      <p className="text-sm text-dim" style={{ marginTop: 12 }}>
        As parcelas em aberto serão canceladas e uma única transação de quitação será registrada.
        Esta ação não pode ser desfeita.
      </p>
    </Modal>
  )
}
