import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  createInstallmentSchema,
  INSTALLMENT_TYPES,
  type CreateInstallmentFormValues,
} from '@/features/installments/schemas/create-installment.schema'
import { useCreateInstallment } from '@/features/installments/hooks/use-create-installment'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'

const INSTALLMENT_TYPE_LABELS: Record<string, string> = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
}

const DEFAULT_VALUES: CreateInstallmentFormValues = {
  description: '',
  totalAmount: '0.00',
  installmentCount: 2,
  accountId: '',
  categoryId: '',
  firstDueDate: new Date().toISOString().split('T')[0],
  type: 'EXPENSE',
}

interface CreateInstallmentDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateInstallmentDialog({ open, onClose }: CreateInstallmentDialogProps) {
  const { mutate: createInstallment, isPending } = useCreateInstallment()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()

  const form = useForm<CreateInstallmentFormValues>({
    resolver: zodResolver(createInstallmentSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const description = form.watch('description')

  function onSubmit(data: CreateInstallmentFormValues) {
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
    }
    createInstallment(payload, {
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
      title="Create Installment Series"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="create-installment-form"
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
              'Create Series'
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-installment-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Description" error={form.formState.errors.description?.message}>
          <Input placeholder="e.g. New laptop" {...form.register('description')} />
        </Field>

        <Field label="Total Amount" error={form.formState.errors.totalAmount?.message}>
          <Input placeholder="e.g. 3600.00" {...form.register('totalAmount')} />
        </Field>

        <Field
          label="Number of Installments"
          error={form.formState.errors.installmentCount?.message}
        >
          <Input
            type="number"
            min={2}
            placeholder="e.g. 12"
            {...form.register('installmentCount', { valueAsNumber: true })}
          />
        </Field>

        <Field label="Type" error={form.formState.errors.type?.message}>
          <Select aria-label="Type" {...form.register('type')}>
            {INSTALLMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {INSTALLMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Account" error={form.formState.errors.accountId?.message}>
          <Select aria-label="Account" {...form.register('accountId')}>
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </Field>

        <Controller
          control={form.control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <Field label="Category" error={fieldState.error?.message}>
              <CategoryPickerCombobox
                value={field.value ?? ''}
                onChange={field.onChange}
                categories={categories}
                description={description}
                aria-label="Category"
              />
            </Field>
          )}
        />

        <Field label="First Due Date" error={form.formState.errors.firstDueDate?.message}>
          <Input type="date" {...form.register('firstDueDate')} />
        </Field>
      </form>
    </Modal>
  )
}
