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
import {
  updateSeriesSchema,
  type UpdateSeriesFormValues,
} from '@/features/installments/schemas/update-series.schema'
import { useUpdateSeries } from '@/features/installments/hooks/use-update-series'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { NativeSelect } from './installment-form-fields'
import type { InstallmentSeries } from '@/features/installments/types'

interface EditSeriesDialogProps {
  series: InstallmentSeries | null
  open: boolean
  onClose: () => void
}

export function EditSeriesDialog({ series, open, onClose }: EditSeriesDialogProps) {
  const { mutate: updateSeries, isPending } = useUpdateSeries()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()

  const form = useForm<UpdateSeriesFormValues>({
    resolver: zodResolver(updateSeriesSchema),
    defaultValues: { description: '', accountId: '', categoryId: '' },
  })

  const description = form.watch('description')

  useEffect(() => {
    if (series) {
      form.reset({
        description: series.description,
        accountId: series.accountId,
        categoryId: series.categoryId ?? '',
      })
    }
  }, [series, form])

  function onSubmit(data: UpdateSeriesFormValues) {
    if (!series) return
    const payload = { ...data, categoryId: data.categoryId || undefined }
    updateSeries({ seriesId: series.id, data: payload }, { onSuccess: () => onClose() })
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Series</DialogTitle>
          <DialogDescription>
            Changes apply to all remaining installments in this series.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="edit-series-form"
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
          </form>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-series-form" disabled={isPending} aria-busy={isPending}>
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
