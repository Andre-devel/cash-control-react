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
import { PaymentMethodSelect } from './payment-method-select'
import { CreditCardSelect } from './credit-card-select'
import { useCards } from '@/features/cards/hooks/use-cards'

const DEFAULT_VALUES: UpdateTransactionFormValues = {
  description: '',
  amount: '0.00',
  categoryId: '',
  competenceDate: new Date().toISOString().split('T')[0],
  notes: '',
  paymentMethod: 'OTHER',
  creditCardId: '',
}

interface EditTransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

export function EditTransactionDialog({ transaction, open, onClose }: EditTransactionDialogProps) {
  const { mutate: updateTransaction, isPending } = useUpdateTransaction()
  const { data: categories = [] } = useCategories()
  const { data: allCards = [] } = useCards()
  const cards = allCards.filter((c) => !c.archivedAt)

  const form = useForm<UpdateTransactionFormValues>({
    resolver: zodResolver(updateTransactionSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const description = form.watch('description')
  const paymentMethod = form.watch('paymentMethod')

  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description,
        amount: transaction.amount,
        categoryId: transaction.categoryId ?? '',
        competenceDate: transaction.competenceDate,
        notes: transaction.notes ?? '',
        paymentMethod: transaction.paymentMethod.slug,
        creditCardId: transaction.creditCard?.id ?? '',
      })
    }
  }, [transaction, form])

  function onSubmit(data: UpdateTransactionFormValues) {
    if (!transaction) return
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
      notes: data.notes || undefined,
      creditCardId: data.creditCardId || undefined,
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
    form.reset(DEFAULT_VALUES)
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

        <Controller
          control={form.control}
          name="paymentMethod"
          render={({ field, fieldState }) => (
            <Field label="Forma de pagamento" error={fieldState.error?.message}>
              <PaymentMethodSelect
                value={field.value ?? 'OTHER'}
                onChange={(value) => {
                  field.onChange(value)
                  if (value !== 'CREDIT_CARD') {
                    form.setValue('creditCardId', '')
                  }
                }}
                aria-label="Forma de pagamento"
              />
            </Field>
          )}
        />

        {paymentMethod === 'CREDIT_CARD' && (
          <Controller
            control={form.control}
            name="creditCardId"
            render={({ field, fieldState }) => (
              <Field label="Cartão de crédito" error={fieldState.error?.message}>
                <CreditCardSelect
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  cards={cards}
                  aria-label="Cartão de crédito"
                />
              </Field>
            )}
          />
        )}
      </form>
    </Modal>
  )
}
