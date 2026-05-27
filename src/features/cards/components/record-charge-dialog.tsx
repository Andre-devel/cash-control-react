import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  recordChargeSchema,
  type RecordChargeFormValues,
} from '@/features/cards/schemas/record-charge.schema'
import { useRecordCharge } from '@/features/cards/hooks/use-record-charge'

const DEFAULT_VALUES: RecordChargeFormValues = {
  description: '',
  amount: '0.00',
  categoryId: '',
  date: '',
}

interface RecordChargeDialogProps {
  cardId: string
  open: boolean
  onClose: () => void
}

export function RecordChargeDialog({ cardId, open, onClose }: RecordChargeDialogProps) {
  const { mutate: recordCharge, isPending } = useRecordCharge(cardId)

  const form = useForm<RecordChargeFormValues>({
    resolver: zodResolver(recordChargeSchema),
    defaultValues: DEFAULT_VALUES,
  })

  function onSubmit(data: RecordChargeFormValues) {
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
    }
    recordCharge(payload, {
      onSuccess: () => {
        form.reset(DEFAULT_VALUES)
        onClose()
      },
    })
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset(DEFAULT_VALUES)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Charge</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="record-charge-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Supermarket" {...field} />
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
                    <Input placeholder="e.g. 150.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category ID (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Category UUID" {...field} />
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
            form="record-charge-form"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Recording…
              </>
            ) : (
              'Record Charge'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
