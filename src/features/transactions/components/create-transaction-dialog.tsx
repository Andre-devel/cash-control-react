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
import { useCreateTransaction } from '@/features/transactions/hooks/use-create-transaction'
import { setFormErrors } from '@/lib/form-errors'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { PaymentMethodSelect } from './payment-method-select'
import { CreditCardSelect } from './credit-card-select'
import { useCards } from '@/features/cards/hooks/use-cards'

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  REFUND: 'Reembolso',
}

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
}

const DEFAULT_VALUES: CreateTransactionFormValues = {
  description: '',
  amount: '0.00',
  type: 'EXPENSE',
  accountId: '',
  categoryId: '',
  competenceDate: new Date().toISOString().split('T')[0],
  status: 'PENDING',
  paymentMethod: 'OTHER',
  creditCardId: '',
}

interface CreateTransactionDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateTransactionDialog({ open, onClose }: CreateTransactionDialogProps) {
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()
  const { data: allCards = [] } = useCards()
  const cards = allCards.filter((c) => !c.archivedAt)

  const form = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { mutate: createTransaction, isPending } = useCreateTransaction({
    onFieldError: (error) => setFormErrors(error, form.setError),
  })

  const description = form.watch('description')
  const paymentMethod = form.watch('paymentMethod')

  function onSubmit(data: CreateTransactionFormValues) {
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
      creditCardId: data.creditCardId || undefined,
    }
    createTransaction(payload, {
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
      title="Nova transação"
      subtitle="Registre uma receita, despesa ou reembolso"
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
            form="create-transaction-form"
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
                Criando…
              </>
            ) : (
              'Criar transação'
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-transaction-form"
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
          <Input
            placeholder="Ex: Supermercado, salário, aluguel…"
            {...form.register('description')}
          />
        </Field>

        <Field label="Valor" required error={form.formState.errors.amount?.message}>
          <Input placeholder="Ex: 150.75" {...form.register('amount')} />
        </Field>

        <Field label="Tipo" error={form.formState.errors.type?.message}>
          <Select aria-label="Tipo" {...form.register('type')}>
            {TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {TRANSACTION_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
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

        <Field label="Status" error={form.formState.errors.status?.message}>
          <Select aria-label="Status" {...form.register('status')}>
            {TRANSACTION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TRANSACTION_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Controller
          control={form.control}
          name="paymentMethod"
          render={({ field, fieldState }) => (
            <Field label="Forma de pagamento" error={fieldState.error?.message}>
              <PaymentMethodSelect
                value={field.value}
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
