import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  createRecurrenceSchema,
  RECURRENCE_FREQUENCIES,
  RECURRENCE_TYPES,
  type CreateRecurrenceFormValues,
} from '@/features/recurrences/schemas/create-recurrence.schema'
import { useCreateRecurrence } from '@/features/recurrences/hooks/use-create-recurrence'

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

  function handleClose() {
    form.reset(DEFAULT_VALUES)
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Create Recurrence Rule"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="create-recurrence-form"
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
                Creating…
              </>
            ) : (
              'Create Rule'
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-recurrence-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Description" error={form.formState.errors.description?.message}>
          <Input placeholder="e.g. Monthly rent" {...form.register('description')} />
        </Field>

        <Field label="Amount" error={form.formState.errors.amount?.message}>
          <Input placeholder="e.g. 1500.00" {...form.register('amount')} />
        </Field>

        <Field label="Type" error={form.formState.errors.type?.message}>
          <Select aria-label="Type" {...form.register('type')}>
            {RECURRENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Frequency" error={form.formState.errors.frequency?.message}>
          <Select aria-label="Frequency" {...form.register('frequency')}>
            {RECURRENCE_FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>
                {FREQUENCY_LABELS[freq]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Account ID" error={form.formState.errors.accountId?.message}>
          <Input placeholder="Account UUID" {...form.register('accountId')} />
        </Field>

        <Field label="Category ID (optional)" error={form.formState.errors.categoryId?.message}>
          <Input placeholder="Category UUID" {...form.register('categoryId')} />
        </Field>

        <Field label="Start Date" error={form.formState.errors.startDate?.message}>
          <Input type="date" {...form.register('startDate')} />
        </Field>
      </form>
    </Modal>
  )
}
