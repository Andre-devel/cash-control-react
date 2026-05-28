import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import {
  createPayInvoiceSchema,
  type PayInvoiceFormValues,
} from '@/features/cards/schemas/pay-invoice.schema'
import { usePayInvoice } from '@/features/cards/hooks/use-pay-invoice'

interface PayInvoiceDialogProps {
  invoiceId: string
  remainingAmount: string
  open: boolean
  onClose: () => void
}

export function PayInvoiceDialog({
  invoiceId,
  remainingAmount,
  open,
  onClose,
}: PayInvoiceDialogProps) {
  const { mutate: payInvoice, isPending } = usePayInvoice()

  const schema = createPayInvoiceSchema(remainingAmount)

  const form = useForm<PayInvoiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: remainingAmount, accountId: '' },
  })

  function onSubmit(data: PayInvoiceFormValues) {
    payInvoice(
      { invoiceId, data },
      {
        onSuccess: () => {
          form.reset()
          onClose()
        },
      },
    )
  }

  function handleClose() {
    form.reset()
    onClose()
  }

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  if (!open) return null

  return (
    <Modal
      title="Pay Invoice"
      subtitle={`Remaining balance: ${formatAmount(remainingAmount)}`}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="pay-invoice-form"
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
                Processing…
              </>
            ) : (
              'Pay Invoice'
            )}
          </Button>
        </>
      }
    >
      <form
        id="pay-invoice-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Payment Amount" error={form.formState.errors.amount?.message}>
          <Input placeholder="e.g. 500.00" {...form.register('amount')} />
        </Field>

        <Field label="Source Account ID" error={form.formState.errors.accountId?.message}>
          <Input placeholder="Account UUID" {...form.register('accountId')} />
        </Field>
      </form>
    </Modal>
  )
}
