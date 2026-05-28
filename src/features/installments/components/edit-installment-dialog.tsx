import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { useUpdateInstallment } from '@/features/installments/hooks/use-update-installment'
import type { InstallmentSeries } from '@/features/installments/types'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

const editInstallmentSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters'),
  amount: z.string().regex(DECIMAL_PATTERN, 'Amount must be a valid decimal amount (e.g. 300.00)'),
  dueDate: z.string().min(1, 'Due date is required'),
})

type EditInstallmentFormValues = z.infer<typeof editInstallmentSchema>

const DEFAULT_VALUES: EditInstallmentFormValues = {
  transactionId: '',
  description: '',
  amount: '0.00',
  dueDate: new Date().toISOString().split('T')[0],
}

interface EditInstallmentDialogProps {
  series: InstallmentSeries | null
  open: boolean
  onClose: () => void
}

export function EditInstallmentDialog({ series, open, onClose }: EditInstallmentDialogProps) {
  const { mutate: updateInstallment, isPending } = useUpdateInstallment()

  const form = useForm<EditInstallmentFormValues>({
    resolver: zodResolver(editInstallmentSchema),
    defaultValues: DEFAULT_VALUES,
  })

  function onSubmit(data: EditInstallmentFormValues) {
    const { transactionId, ...rest } = data
    updateInstallment(
      { transactionId, data: rest },
      {
        onSuccess: () => {
          form.reset(DEFAULT_VALUES)
          onClose()
        },
      },
    )
  }

  function handleClose() {
    form.reset(DEFAULT_VALUES)
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Edit Individual Installment"
      subtitle={`Individual override — applies only to this installment, not the entire series${series ? ` "${series.description}"` : ''}.`}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="edit-installment-form"
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
                Saving…
              </>
            ) : (
              'Save Installment'
            )}
          </Button>
        </>
      }
    >
      <form
        id="edit-installment-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Transaction ID" error={form.formState.errors.transactionId?.message}>
          <Input
            placeholder="Paste the transaction ID from the transactions list"
            {...form.register('transactionId')}
          />
        </Field>

        <Field label="Description" error={form.formState.errors.description?.message}>
          <Input placeholder="e.g. New laptop — installment 3" {...form.register('description')} />
        </Field>

        <Field label="Amount" error={form.formState.errors.amount?.message}>
          <Input placeholder="e.g. 300.00" {...form.register('amount')} />
        </Field>

        <Field label="Due Date" error={form.formState.errors.dueDate?.message}>
          <Input type="date" {...form.register('dueDate')} />
        </Field>
      </form>
    </Modal>
  )
}
