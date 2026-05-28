import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  updateSeriesSchema,
  type UpdateSeriesFormValues,
} from '@/features/installments/schemas/update-series.schema'
import { useUpdateSeries } from '@/features/installments/hooks/use-update-series'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
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
    defaultValues: { description: '', accountId: '', categoryId: '', notes: '' },
  })

  const description = form.watch('description')

  useEffect(() => {
    if (series) {
      form.reset({
        description: series.description,
        accountId: series.accountId,
        categoryId: series.categoryId ?? '',
        notes: '',
      })
    }
  }, [series, form])

  function onSubmit(data: UpdateSeriesFormValues) {
    if (!series) return
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
      notes: data.notes || undefined,
    }
    updateSeries({ seriesId: series.id, data: payload }, { onSuccess: () => onClose() })
  }

  function handleClose() {
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Edit Series"
      subtitle="Changes apply to all remaining installments in this series."
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="edit-series-form"
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
        id="edit-series-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Description" error={form.formState.errors.description?.message}>
          <Input placeholder="e.g. New laptop" {...form.register('description')} />
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

        <Field label="Notes (optional)" error={form.formState.errors.notes?.message}>
          <Textarea
            placeholder="Any notes about this series…"
            rows={3}
            {...form.register('notes')}
          />
        </Field>
      </form>
    </Modal>
  )
}
