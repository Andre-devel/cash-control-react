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
  createInstallmentSchema,
  INSTALLMENT_TYPES,
  type CreateInstallmentFormValues,
} from '@/features/installments/schemas/create-installment.schema'
import { useCreateInstallment } from '@/features/installments/hooks/use-create-installment'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { NativeSelect } from './installment-form-fields'

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
          <DialogTitle>Create Installment Series</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="create-installment-form"
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
                    <Input placeholder="e.g. New laptop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 3600.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="installmentCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Installments</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={2}
                      placeholder="e.g. 12"
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

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <NativeSelect aria-label="Type" {...field}>
                      {INSTALLMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {INSTALLMENT_TYPE_LABELS[type]}
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
              name="firstDueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Due Date</FormLabel>
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
            form="create-installment-form"
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
              'Create Series'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
