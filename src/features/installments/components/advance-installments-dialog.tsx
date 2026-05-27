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

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset({ count: 1 })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Advance Installments</DialogTitle>
          <DialogDescription>
            Move upcoming installments of{' '}
            <span className="font-semibold">{series?.description}</span> to the current period.
          </DialogDescription>
        </DialogHeader>

        {series && (
          <div className="rounded-md border border-border bg-muted/40 px-4 py-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining installments</span>
              <span className="font-medium">{remaining}</span>
            </div>
            {series.nextDueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next due date</span>
                <span className="font-medium">{series.nextDueDate}</span>
              </div>
            )}
          </div>
        )}

        <Form {...form}>
          <form
            id="advance-installments-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of installments to advance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={remaining || undefined}
                      placeholder="e.g. 1"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <p className="text-xs text-muted-foreground">
          The selected installments will have their due dates moved to the current billing period.
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="advance-installments-form"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Advancing…
              </>
            ) : (
              'Advance Installments'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
