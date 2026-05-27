import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
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

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset(DEFAULT_VALUES)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Individual Installment</DialogTitle>
          <DialogDescription>
            <span className="inline-flex items-center gap-1.5 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              Individual override
            </span>{' '}
            This change applies only to a single installment, not the entire series{' '}
            {series ? `"${series.description}"` : ''}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="edit-installment-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Paste the transaction ID from the transactions list"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New laptop — installment 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 300.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
          <Button
            type="submit"
            form="edit-installment-form"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Saving…
              </>
            ) : (
              'Save Installment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
