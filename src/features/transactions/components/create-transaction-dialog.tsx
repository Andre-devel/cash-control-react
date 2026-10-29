import { useEffect } from 'react'
import { ArrowDownLeft, ArrowUpRight, CircleCheck, Clock, RotateCcw } from 'lucide-react'
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
import { SegmentedRadio, type SegmentedOption } from './segmented-radio'
import { submitOnModEnter } from '@/features/transactions/utils/form-shortcuts'
import '@/features/transactions/transactions.css'

const TRANSACTION_TYPE_LABELS: Record<(typeof TRANSACTION_TYPES)[number], string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  REFUND: 'Reembolso',
}

const TYPE_ICONS = {
  INCOME: <ArrowDownLeft size={15} aria-hidden="true" />,
  EXPENSE: <ArrowUpRight size={15} aria-hidden="true" />,
  REFUND: <RotateCcw size={15} aria-hidden="true" />,
}

const TYPE_ACTIVE_CLASS = {
  INCOME: 'peer-checked:text-income',
  EXPENSE: 'peer-checked:text-expense',
  REFUND: 'peer-checked:text-info',
}

const TYPE_OPTIONS: SegmentedOption[] = TRANSACTION_TYPES.map((t) => ({
  value: t,
  label: TRANSACTION_TYPE_LABELS[t],
  icon: TYPE_ICONS[t],
  activeClass: TYPE_ACTIVE_CLASS[t],
}))

const STATUS_OPTIONS: SegmentedOption[] = TRANSACTION_STATUSES.map((s) => ({
  value: s,
  label: TRANSACTION_STATUS_LABELS[s],
  icon:
    s === 'PAID' ? (
      <CircleCheck size={15} aria-hidden="true" />
    ) : (
      <Clock size={15} aria-hidden="true" />
    ),
  activeClass: s === 'PAID' ? 'peer-checked:text-paid' : 'peer-checked:text-pending',
}))

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
  const type = form.watch('type')
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

  const isPositiveType = type === 'INCOME' || type === 'REFUND'

  return (
    <Modal
      panel
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
            loading={isPending}
            trailing={
              <kbd
                aria-hidden="true"
                className="hidden font-mono text-overline opacity-70 xl:inline"
              >
                ⌘↵
              </kbd>
            }
          >
            {isPending ? 'Criando…' : 'Criar transação'}
          </Button>
        </>
      }
    >
      <form
        id="create-transaction-form"
        onSubmit={form.handleSubmit(onSubmit)}
        onKeyDown={submitOnModEnter}
        noValidate
        className="flex flex-col gap-4"
      >
        {form.formState.errors.root && (
          <div role="alert" className="err">
            {form.formState.errors.root.message}
          </div>
        )}

        <SegmentedRadio
          legend="Tipo"
          options={TYPE_OPTIONS}
          registration={form.register('type')}
          error={form.formState.errors.type?.message}
        />

        <div className="[display:grid] grid-cols-1 gap-4 md:grid-cols-2">
          <div className="tx-amount" data-positive={isPositiveType}>
            <Field label="Valor" required error={form.formState.errors.amount?.message}>
              <MoneyInput
                placeholder="0,00"
                currency={isPositiveType ? '+ R$' : '− R$'}
                {...form.register('amount')}
              />
            </Field>
          </div>

          <Field label="Descrição" required error={form.formState.errors.description?.message}>
            <Input
              placeholder="Ex: Supermercado, salário, aluguel…"
              {...form.register('description')}
            />
          </Field>
        </div>

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

        <div className="[display:grid] grid-cols-1 gap-4 md:grid-cols-2">
          {/* Cartão só aparece com forma = Crédito; a conta continua obrigatória. */}
          {paymentMethod === 'CREDIT_CARD' && (
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
          )}

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

          {paymentMethod === 'CREDIT_CARD' && (
            <Field label="Número de parcelas" error={form.formState.errors.installments?.message}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={360}
                placeholder="ex: 12"
                {...form.register('installments', { valueAsNumber: true })}
              />
            </Field>
          )}

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

          {paymentMethod !== 'CREDIT_CARD' && status === 'PAID' && (
            <Field
              label="Data do pagamento"
              hint="Em branco, usa a data de competência."
              error={form.formState.errors.paymentDate?.message}
            >
              <Input type="date" {...form.register('paymentDate')} />
            </Field>
          )}
        </div>

        {paymentMethod !== 'CREDIT_CARD' && (
          <SegmentedRadio
            legend="Status"
            className="md:max-w-[320px]"
            options={STATUS_OPTIONS}
            registration={form.register('status')}
            error={form.formState.errors.status?.message}
          />
        )}

        <Field label="Observações" error={form.formState.errors.notes?.message}>
          <Textarea
            rows={2}
            placeholder="Algo para lembrar (opcional)"
            {...form.register('notes')}
          />
        </Field>
      </form>
    </Modal>
  )
}
