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
  createRecurrenceSchema,
  RECURRENCE_FREQUENCIES,
  RECURRENCE_TYPES,
  type CreateRecurrenceFormValues,
} from '@/features/recurrences/schemas/create-recurrence.schema'
import { useCreateRecurrence } from '@/features/recurrences/hooks/use-create-recurrence'
import { NativeSelect } from './recurrence-form-fields'

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
}

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
}

const DEFAULT_VALUES: CreateRecurrenceFormValues = {
  description: '',
  amount: '0.00',
  frequency: 'MONTHLY',
  type: 'EXPENSE',
  accountId: '',
  categoryId: '',
  startDate: '',
}

interface CreateRecurrenceDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateRecurrenceDialog({ open, onClose }: CreateRecurrenceDialogProps) {
  const { mutate: createRecurrence, isPending } = useCreateRecurrence()

  const form = useForm<CreateRecurrenceFormValues>({
    resolver: zodResolver(createRecurrenceSchema),
    defaultValues: DEFAULT_VALUES,
  })

  function onSubmit(data: CreateRecurrenceFormValues) {
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
    }
    createRecurrence(payload, {
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
          <DialogTitle>Create Recurrence Rule</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="create-recurrence-form"
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
                    <Input placeholder="e.g. Monthly rent" {...field} />
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
                    <Input placeholder="e.g. 1500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <NativeSelect aria-label="Type" {...field}>
                      {RECURRENCE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {TYPE_LABELS[type]}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <FormControl>
                    <NativeSelect aria-label="Frequency" {...field}>
                      {RECURRENCE_FREQUENCIES.map((freq) => (
                        <option key={freq} value={freq}>
                          {FREQUENCY_LABELS[freq]}
                        </option>
                      ))}
                    </NativeSelect>
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
                  <FormLabel>Account ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Account UUID" {...field} />
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

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
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
            form="create-recurrence-form"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Creating…
              </>
            ) : (
              'Create Rule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
