import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
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

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Invoice</DialogTitle>
          <DialogDescription>
            Remaining balance:{' '}
            <span className="font-semibold">{formatAmount(remainingAmount)}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="pay-invoice-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Account ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Account UUID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="pay-invoice-form" disabled={isPending} aria-busy={isPending}>
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Processing…
              </>
            ) : (
              'Pay Invoice'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
