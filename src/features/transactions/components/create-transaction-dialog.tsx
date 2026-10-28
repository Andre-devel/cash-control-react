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
import {
  createTransactionSchema,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  type CreateTransactionFormValues,
} from '@/features/transactions/schemas/create-transaction.schema'
import { useCreateTransaction } from '@/features/transactions/hooks/use-create-transaction'
import { useCreateInstallment } from '@/features/installments/hooks/use-create-installment'
import { setFormErrors } from '@/lib/form-errors'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { PaymentMethodSelect } from './payment-method-select'
import { CreditCardSelect } from './credit-card-select'
import { useCards } from '@/features/cards/hooks/use-cards'
import { TRANSACTION_STATUS_LABELS } from '@/features/transactions/utils/transaction-status'
import { localIsoDate } from '@/lib/local-date'

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  REFUND: 'Reembolso',
}

function defaultValues(): CreateTransactionFormValues {
  return {
    description: '',
    amount: '',
    type: 'EXPENSE',
    accountId: '',
    categoryId: '',
    competenceDate: localIsoDate(),
    // Lançamento manual com data de hoje quase sempre já aconteceu.
    status: 'PAID',
    paymentDate: '',
    notes: '',
    paymentMethod: 'OTHER',
    creditCardId: '',
    installments: 1,
  }
}

interface CreateTransactionDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateTransactionDialog({ open, onClose }: CreateTransactionDialogProps) {
  const { data: categories = [] } = useCategories()
  const { data: allAccounts = [] } = useAccounts()
  const accounts = allAccounts.filter((a) => !a.archivedAt)
  const { data: allCards = [] } = useCards()
  const cards = allCards.filter((c) => !c.archivedAt)

  const form = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: defaultValues(),
  })

  const { mutate: createTransaction, isPending: isPendingTransaction } = useCreateTransaction({
    onFieldError: (error) => setFormErrors(error, form.setError),
  })
  const { mutate: createInstallment, isPending: isPendingInstallment } = useCreateInstallment({
    onFieldError: (error) => setFormErrors(error, form.setError),
  })
  const isPending = isPendingTransaction || isPendingInstallment

  const description = form.watch('description')
  const paymentMethod = form.watch('paymentMethod')
  const status = form.watch('status')
  const competenceDate = form.watch('competenceDate')
  const creditCardId = form.watch('creditCardId')
  const selectedCard = cards.find((c) => c.id === creditCardId)

  // Com uma conta só não há o que escolher.
  const onlyAccountId = accounts.length === 1 ? accounts[0]!.id : undefined
  useEffect(() => {
    if (open && onlyAccountId && !form.getValues('accountId')) {
      form.setValue('accountId', onlyAccountId)
    }
  }, [open, onlyAccountId, form])

  // Data futura sugere Pendente, até hoje sugere Pago — enquanto o usuário não escolher.
  useEffect(() => {
    if (form.getFieldState('status').isDirty || !competenceDate) return
    form.setValue('status', competenceDate > localIsoDate() ? 'PENDING' : 'PAID')
  }, [competenceDate, form])

  function onSubmit(data: CreateTransactionFormValues) {
    const onSuccess = () => {
      form.reset(defaultValues())
      onClose()
    }

    if (data.paymentMethod === 'CREDIT_CARD' && data.installments >= 2) {
      createInstallment(
        {
          description: data.description,
          totalAmount: data.amount,
          totalInstallments: data.installments,
          accountId: data.accountId,
          categoryId: data.categoryId || undefined,
          firstPaymentDate: data.competenceDate,
          paymentMethod: data.paymentMethod,
          creditCardId: data.creditCardId || undefined,
        },
        { onSuccess },
      )
    } else {
      // Compra no cartão fica pendente até a fatura ser paga — o backend recusa PAGA.
      const status = data.paymentMethod === 'CREDIT_CARD' ? 'PENDING' : data.status
      const { installments: _installments, ...fields } = data
      createTransaction(
        {
          ...fields,
          status,
          paymentDate: (status === 'PAID' && data.paymentDate) || undefined,
          notes: data.notes?.trim() || undefined,
          categoryId: data.categoryId || undefined,
          creditCardId: data.creditCardId || undefined,
        },
        { onSuccess },
      )
    }
  }

  function handleClose() {
    form.reset(defaultValues())
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
          <MoneyInput placeholder="Ex: 150,75" {...form.register('amount')} />
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

        {paymentMethod !== 'CREDIT_CARD' && (
          <Field label="Status" error={form.formState.errors.status?.message}>
            <Select aria-label="Status" {...form.register('status')}>
              {TRANSACTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TRANSACTION_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {paymentMethod !== 'CREDIT_CARD' && status === 'PAID' && (
          <Field
            label="Data do pagamento"
            hint="Em branco, usa a data de competência."
            error={form.formState.errors.paymentDate?.message}
          >
            <Input type="date" {...form.register('paymentDate')} />
          </Field>
        )}

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
                    form.setValue('installments', 1)
                  }
                }}
                aria-label="Forma de pagamento"
              />
            </Field>
          )}
        />

        {paymentMethod === 'CREDIT_CARD' && (
          <>
            <Controller
              control={form.control}
              name="creditCardId"
              render={({ field, fieldState }) => (
                <Field
                  label="Cartão de crédito"
                  hint={
                    selectedCard
                      ? `Fecha dia ${selectedCard.closingDay} · vence dia ${selectedCard.dueDay}`
                      : undefined
                  }
                  error={fieldState.error?.message}
                >
                  <CreditCardSelect
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    cards={cards}
                    aria-label="Cartão de crédito"
                  />
                </Field>
              )}
            />
            <Field label="Número de parcelas" error={form.formState.errors.installments?.message}>
              <Input
                type="number"
                min={1}
                max={360}
                placeholder="ex: 12"
                {...form.register('installments', { valueAsNumber: true })}
              />
            </Field>
          </>
        )}

        <Field label="Notas" error={form.formState.errors.notes?.message}>
          <Textarea rows={2} {...form.register('notes')} />
        </Field>
      </form>
    </Modal>
  )
}
