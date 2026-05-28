import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  createTransactionSchema,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  type CreateTransactionFormValues,
} from '@/features/transactions/schemas/create-transaction.schema'
import { useUpdateTransaction } from '@/features/transactions/hooks/use-update-transaction'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import type { Transaction } from '@/features/transactions/types'

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
}

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
}

interface EditTransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

export function EditTransactionDialog({ transaction, open, onClose }: EditTransactionDialogProps) {
  const { mutate: updateTransaction, isPending } = useUpdateTransaction()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()

  const form = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      description: '',
      amount: '0.00',
      type: 'EXPENSE',
      accountId: '',
      categoryId: '',
      competenceDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    },
  })

  const description = form.watch('description')

  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        accountId: transaction.accountId,
        categoryId: transaction.categoryId ?? '',
        competenceDate: transaction.competenceDate,
        status: transaction.status,
      })
    }
  }, [transaction, form])

  function onSubmit(data: CreateTransactionFormValues) {
    if (!transaction) return
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
    }
    updateTransaction(
      { id: transaction.id, data: payload },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  function handleClose() {
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Edit Transaction"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="edit-transaction-form"
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
              'Save Changes'
            )}
          </Button>
        </>
      }
    >
      <form
        id="edit-transaction-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Description" error={form.formState.errors.description?.message}>
          <Input placeholder="e.g. Supermarket" {...form.register('description')} />
        </Field>

        <Field label="Amount" error={form.formState.errors.amount?.message}>
          <Input placeholder="e.g. 150.75" {...form.register('amount')} />
        </Field>

        <Field label="Type" error={form.formState.errors.type?.message}>
          <Select aria-label="Type" {...form.register('type')}>
            {TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {TRANSACTION_TYPE_LABELS[type]}
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

        <Field label="Date" error={form.formState.errors.competenceDate?.message}>
          <Input type="date" {...form.register('competenceDate')} />
        </Field>

        <Field label="Status" error={form.formState.errors.status?.message}>
          <Select aria-label="Status" {...form.register('status')}>
            {TRANSACTION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TRANSACTION_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  )
}
