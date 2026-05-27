import { useEffect } from 'react'
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
import { useUpdateRecurrence } from '@/features/recurrences/hooks/use-update-recurrence'
import { NativeSelect } from './recurrence-form-fields'
import type { Recurrence } from '@/features/recurrences/types'

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

interface EditRecurrenceDialogProps {
  recurrence: Recurrence | null
  open: boolean
  onClose: () => void
}

export function EditRecurrenceDialog({ recurrence, open, onClose }: EditRecurrenceDialogProps) {
  const { mutate: updateRecurrence, isPending } = useUpdateRecurrence()

  const form = useForm<CreateRecurrenceFormValues>({
    resolver: zodResolver(createRecurrenceSchema),
    defaultValues: {
      description: '',
      amount: '0.00',
      frequency: 'MONTHLY',
      type: 'EXPENSE',
      accountId: '',
      categoryId: '',
      startDate: '',
    },
  })

  useEffect(() => {
    if (recurrence) {
      form.reset({
        description: recurrence.description,
        amount: recurrence.amount,
        frequency: recurrence.frequency,
        type: recurrence.type,
        accountId: recurrence.accountId,
        categoryId: recurrence.categoryId ?? '',
        startDate: recurrence.startDate,
      })
    }
  }, [recurrence, form])

  function onSubmit(data: CreateRecurrenceFormValues) {
    if (!recurrence) return
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
    }
    updateRecurrence(
      { id: recurrence.id, data: payload },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recurrence Rule</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="edit-recurrence-form"
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
            form="edit-recurrence-form"
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
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
