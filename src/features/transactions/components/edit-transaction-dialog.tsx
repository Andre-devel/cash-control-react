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
  createTransactionSchema,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  type CreateTransactionFormValues,
} from '@/features/transactions/schemas/create-transaction.schema'
import { useUpdateTransaction } from '@/features/transactions/hooks/use-update-transaction'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { NativeSelect } from './transaction-form-fields'
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

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="edit-transaction-form"
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
                    <Input placeholder="e.g. 150.75" {...field} />
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
                      {TRANSACTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {TRANSACTION_TYPE_LABELS[type]}
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
                  <FormLabel>Account</FormLabel>
                  <FormControl>
                    <NativeSelect aria-label="Account" {...field}>
                      <option value="">Select an account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategoryPickerCombobox
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      categories={categories}
                      description={description}
                      aria-label="Category"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="competenceDate"
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <NativeSelect aria-label="Status" {...field}>
                      {TRANSACTION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {TRANSACTION_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </NativeSelect>
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
            form="edit-transaction-form"
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
