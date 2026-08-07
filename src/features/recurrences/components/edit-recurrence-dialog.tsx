import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  updateRecurrenceSchema,
  type UpdateRecurrenceFormValues,
} from '@/features/recurrences/schemas/update-recurrence.schema'
import { useUpdateRecurrence } from '@/features/recurrences/hooks/use-update-recurrence'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import type { Recurrence } from '@/features/recurrences/types'

interface EditRecurrenceDialogProps {
  recurrence: Recurrence | null
  open: boolean
  onClose: () => void
}

export function EditRecurrenceDialog({ recurrence, open, onClose }: EditRecurrenceDialogProps) {
  const { mutate: updateRecurrence, isPending } = useUpdateRecurrence()
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()

  const form = useForm<UpdateRecurrenceFormValues>({
    resolver: zodResolver(updateRecurrenceSchema),
    defaultValues: {
      description: '',
      amount: '0.00',
      accountId: '',
      categoryId: '',
    },
  })

  useEffect(() => {
    if (recurrence) {
      form.reset({
        description: recurrence.description,
        amount: recurrence.amount,
        accountId: recurrence.accountId,
        categoryId: recurrence.categoryId ?? '',
      })
    }
  }, [recurrence, form])

  function onSubmit(data: UpdateRecurrenceFormValues) {
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

  function handleClose() {
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Editar regra de recorrência"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="edit-recurrence-form"
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
                Salvando…
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </>
      }
    >
      <form
        id="edit-recurrence-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Descrição" error={form.formState.errors.description?.message}>
          <Input placeholder="ex: Aluguel mensal" {...form.register('description')} />
        </Field>

        <Field label="Valor" error={form.formState.errors.amount?.message}>
          <MoneyInput placeholder="ex: 1500,00" {...form.register('amount')} />
        </Field>

        <Field label="Conta" required error={form.formState.errors.accountId?.message}>
          <Select aria-label="Conta" {...form.register('accountId')}>
            <option value="">Selecionar conta</option>
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
            <Field label="Categoria (opcional)" error={fieldState.error?.message}>
              <CategoryPickerCombobox
                value={field.value ?? ''}
                onChange={field.onChange}
                categories={categories}
                aria-label="Categoria"
              />
            </Field>
          )}
        />
      </form>
    </Modal>
  )
}
