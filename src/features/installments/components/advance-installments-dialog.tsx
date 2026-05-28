import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { useAdvanceInstallments } from '@/features/installments/hooks/use-advance-installments'
import type { InstallmentSeries } from '@/features/installments/types'

const advanceSchema = z.object({
  count: z
    .number()
    .int('Count must be a whole number')
    .min(1, 'At least 1 installment must be advanced'),
})

type AdvanceFormValues = z.infer<typeof advanceSchema>

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

  const remaining = series ? series.installmentCount - series.paidCount : 0

  const form = useForm<AdvanceFormValues>({
    resolver: zodResolver(advanceSchema),
    defaultValues: { count: 1 },
  })

  function onSubmit(data: AdvanceFormValues) {
    if (!series) return
    advanceInstallments(
      { seriesId: series.id, count: data.count },
      {
        onSuccess: () => {
          form.reset({ count: 1 })
          onClose()
        },
      },
    )
  }

  function handleClose() {
    form.reset({ count: 1 })
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Advance Installments"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="advance-installments-form"
            variant="primary"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span
                  className="animate-spin"
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                  aria-hidden="true"
                />
                Advancing…
              </>
            ) : (
              'Advance Installments'
            )}
          </Button>
        </>
      }
    >
      <p>
        Move upcoming installments of <strong>{series?.description}</strong> to the current period.
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
            <span className="text-dim">Remaining installments</span>
            <span className="font-medium">{remaining}</span>
          </div>
          {series.nextDueDate && (
            <div className="flex justify-between">
              <span className="text-dim">Next due date</span>
              <span className="font-medium">{series.nextDueDate}</span>
            </div>
          )}
        </div>
      )}

      <form
        id="advance-installments-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
        style={{ marginTop: 12 }}
      >
        <Field
          label="Number of installments to advance"
          error={form.formState.errors.count?.message}
        >
          <Input
            type="number"
            min={1}
            max={remaining || undefined}
            placeholder="e.g. 1"
            {...form.register('count', { valueAsNumber: true })}
          />
        </Field>
      </form>

      <p className="text-xs text-dim" style={{ marginTop: 8 }}>
        The selected installments will have their due dates moved to the current billing period.
      </p>
    </Modal>
  )
}
