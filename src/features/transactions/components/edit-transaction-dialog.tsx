import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TRANSACTION_STATUS_LABELS } from '@/features/transactions/utils/transaction-status'
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
import { localIsoDate } from '@/lib/local-date'
import { setFormErrors } from '@/lib/form-errors'
import { formatMoneyInput } from '@/lib/money'

const DEFAULT_VALUES: UpdateTransactionFormValues = {
  description: '',
  amount: '',
  categoryId: '',
  competenceDate: localIsoDate(),
  status: undefined,
  paymentDate: '',
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
  const { data: categories = [] } = useCategories()
  const { data: allCards = [] } = useCards()
  const cards = allCards.filter((c) => !c.archivedAt)

  const form = useForm<UpdateTransactionFormValues>({
    resolver: zodResolver(updateTransactionSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const { mutate: updateTransaction, isPending } = useUpdateTransaction({
    onFieldError: (error) => setFormErrors(error, form.setError),
  })

  const description = form.watch('description')
  const paymentMethod = form.watch('paymentMethod')
  const status = form.watch('status')
  // Compra no cartão é paga pela fatura: status e data de pagamento não são editáveis aqui.
  const editableStatus =
    paymentMethod !== 'CREDIT_CARD' && transaction?.paymentMethod.slug !== 'CREDIT_CARD'

  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description,
        amount: formatMoneyInput(transaction.amount),
        categoryId: transaction.categoryId ?? '',
        competenceDate: transaction.competenceDate,
        status: transaction.status === 'CANCELLED' ? undefined : transaction.status,
        paymentDate: transaction.paymentDate ?? '',
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
      status: editableStatus ? data.status : undefined,
      paymentDate: (editableStatus && data.status === 'PAID' && data.paymentDate) || undefined,
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
        {form.formState.errors.root && (
          <div role="alert" className="err">
            {form.formState.errors.root.message}
          </div>
        )}
        <Field label="Descrição" required error={form.formState.errors.description?.message}>
          <Input placeholder="Ex: Supermercado" {...form.register('description')} />
        </Field>

        <Field label="Valor" required error={form.formState.errors.amount?.message}>
          <MoneyInput placeholder="Ex: 150,75" {...form.register('amount')} />
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

        {/* Pago não volta a pendente (a API recusa); para desfazer, cancele a transação. */}
        {editableStatus && status && transaction?.status !== 'PAID' && (
          <Field label="Status" error={form.formState.errors.status?.message}>
            <Select {...form.register('status')}>
              {[transaction?.status === 'OVERDUE' ? 'OVERDUE' : 'PENDING', 'PAID'].map((s) => (
                <option key={s} value={s}>
                  {TRANSACTION_STATUS_LABELS[s as 'PENDING' | 'OVERDUE' | 'PAID']}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {editableStatus && status === 'PAID' && (
          <Field
            label="Data do pagamento"
            hint="Em branco, usa a data de hoje."
            error={form.formState.errors.paymentDate?.message}
          >
            <Input type="date" {...form.register('paymentDate')} />
          </Field>
        )}

        <Field label="Notas" error={form.formState.errors.notes?.message}>
          <Textarea rows={2} placeholder="Observações opcionais…" {...form.register('notes')} />
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
