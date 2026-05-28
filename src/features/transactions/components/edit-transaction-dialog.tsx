import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import {
  updateTransactionSchema,
  type UpdateTransactionFormValues,
} from '@/features/transactions/schemas/update-transaction.schema'
import { useUpdateTransaction } from '@/features/transactions/hooks/use-update-transaction'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import type { Transaction } from '@/features/transactions/types'

interface EditTransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

export function EditTransactionDialog({ transaction, open, onClose }: EditTransactionDialogProps) {
  const { mutate: updateTransaction, isPending } = useUpdateTransaction()
  const { data: categories = [] } = useCategories()

  const form = useForm<UpdateTransactionFormValues>({
    resolver: zodResolver(updateTransactionSchema),
    defaultValues: {
      description: '',
      amount: '0.00',
      categoryId: '',
      competenceDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  })

  const description = form.watch('description')

  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description,
        amount: transaction.amount,
        categoryId: transaction.categoryId ?? '',
        competenceDate: transaction.competenceDate,
        notes: transaction.notes ?? '',
      })
    }
  }, [transaction, form])

  function onSubmit(data: UpdateTransactionFormValues) {
    if (!transaction) return
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
      notes: data.notes || undefined,
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
      title="Editar transação"
      onClose={handleClose}
      wide
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
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
        id="edit-transaction-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Descrição" required error={form.formState.errors.description?.message}>
          <Input placeholder="Ex: Supermercado" {...form.register('description')} />
        </Field>

        <Field label="Valor" required error={form.formState.errors.amount?.message}>
          <Input placeholder="Ex: 150.75" {...form.register('amount')} />
        </Field>

        <Controller
          control={form.control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <Field label="Categoria" error={fieldState.error?.message}>
              <CategoryPickerCombobox
                value={field.value ?? ''}
                onChange={field.onChange}
                categories={categories}
                description={description}
                aria-label="Categoria"
              />
            </Field>
          )}
        />

        <Field
          label="Data de competência"
          required
          error={form.formState.errors.competenceDate?.message}
        >
          <Input type="date" {...form.register('competenceDate')} />
        </Field>

        <Field label="Notas" error={form.formState.errors.notes?.message}>
          <Input placeholder="Observações opcionais…" {...form.register('notes')} />
        </Field>
      </form>
    </Modal>
  )
}
