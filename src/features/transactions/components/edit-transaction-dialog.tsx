import { useEffect } from 'react'
import { CircleAlert, CircleCheck, Clock } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { TRANSACTION_STATUS_LABELS } from '@/features/transactions/utils/transaction-status'
import {
  updateTransactionSchema,
  type UpdateTransactionFormValues,
} from '@/features/transactions/schemas/update-transaction.schema'
import { useUpdateTransaction } from '@/features/transactions/hooks/use-update-transaction'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useCategorizationRuleOffer } from '@/features/categories/hooks/use-categorization-rule-offer'
import { CreateRuleDialog } from '@/features/categories/components/categorization-rules-section'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import type { Transaction } from '@/features/transactions/types'
import { PaymentMethodSelect } from './payment-method-select'
import { CreditCardSelect } from './credit-card-select'
import { useCards } from '@/features/cards/hooks/use-cards'
import { localIsoDate } from '@/lib/local-date'
import { setFormErrors } from '@/lib/form-errors'
import { formatMoneyInput } from '@/lib/money'
import { TRANSACTION_TYPE_DISPLAY } from '@/features/transactions/utils/transaction-type'
import { submitOnModEnter } from '@/features/transactions/utils/form-shortcuts'
import { SegmentedRadio, type SegmentedOption } from './segmented-radio'
import '@/features/transactions/transactions.css'

const TYPE_OPTIONS: SegmentedOption[] = (['INCOME', 'REFUND'] as const).map((t) => ({
  value: t,
  label: TRANSACTION_TYPE_DISPLAY[t].label,
  activeClass: 'peer-checked:text-income',
}))

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
  type: undefined,
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
  const { data: allAccounts = [] } = useAccounts()
  const accounts = allAccounts.filter((a) => !a.archivedAt)
  // O diálogo de regra sobrevive ao fechamento deste: a oferta chega depois de salvar.
  const ruleOffer = useCategorizationRuleOffer(categories)

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
  // Receita e reembolso trocam entre si (ex.: Pix que o banco trouxe como reembolso). No cartão
  // o reembolso é estorno da fatura, então o tipo fica fixo.
  const editableType =
    (transaction?.type === 'INCOME' || transaction?.type === 'REFUND') &&
    !transaction.creditCard &&
    paymentMethod !== 'CREDIT_CARD'

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
        type:
          transaction.type === 'INCOME' || transaction.type === 'REFUND'
            ? transaction.type
            : undefined,
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
      type: editableType ? data.type : undefined,
    }
    updateTransaction(
      { id: transaction.id, data: payload },
      {
        onSuccess: () => {
          offerRule(transaction, payload.categoryId ?? null)
          onClose()
        },
      },
    )
  }

  /**
   * Trocou a categoria de uma transação vinda do banco: oferece a regra que faria a troca
   * sozinha nos próximos imports. A contraparte é a única marca de origem que a API devolve
   * na transação, então lançamentos de arquivo (CSV, PDF da fatura) não entram aqui.
   */
  function offerRule(original: Transaction, categoryId: string | null) {
    if (!original.counterpartyName || categoryId === original.categoryId) return
    ruleOffer.offer({
      description: original.description,
      counterpartyName: original.counterpartyName,
      categoryId,
      accountId: original.accountId,
    })
  }

  function handleClose() {
    form.reset(DEFAULT_VALUES)
    onClose()
  }

  const ruleDialog = (
    <CreateRuleDialog
      open={ruleOffer.draft !== null}
      onClose={ruleOffer.close}
      categories={categories}
      accounts={accounts}
      initialValues={ruleOffer.draft}
    />
  )

  if (!open) return ruleDialog

  const isPositiveType = transaction?.type === 'INCOME' || transaction?.type === 'REFUND'
  const statusOptions: SegmentedOption[] = [
    transaction?.status === 'OVERDUE' ? 'OVERDUE' : 'PENDING',
    'PAID',
  ].map((s) => ({
    value: s,
    label: TRANSACTION_STATUS_LABELS[s as 'PENDING' | 'OVERDUE' | 'PAID'],
    icon:
      s === 'PAID' ? (
        <CircleCheck size={15} aria-hidden="true" />
      ) : s === 'OVERDUE' ? (
        <CircleAlert size={15} aria-hidden="true" />
      ) : (
        <Clock size={15} aria-hidden="true" />
      ),
    activeClass:
      s === 'PAID'
        ? 'peer-checked:text-paid'
        : s === 'OVERDUE'
          ? 'peer-checked:text-overdue'
          : 'peer-checked:text-pending',
  }))

  return (
    <>
      <Modal
        panel
        title="Editar transação"
        subtitle={transaction ? TRANSACTION_TYPE_DISPLAY[transaction.type].label : undefined}
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
              {isPending ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </>
        }
      >
        <form
          id="edit-transaction-form"
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
              <Input placeholder="Ex: Supermercado" {...form.register('description')} />
            </Field>
          </div>

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

          <div className="[display:grid] grid-cols-1 gap-4 md:grid-cols-2">
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

            {editableStatus && status === 'PAID' && (
              <Field
                label="Data do pagamento"
                hint="Em branco, usa a data de hoje."
                error={form.formState.errors.paymentDate?.message}
              >
                <Input type="date" {...form.register('paymentDate')} />
              </Field>
            )}
          </div>

          {editableType && (
            <SegmentedRadio
              legend="Tipo"
              className="md:max-w-[320px]"
              options={TYPE_OPTIONS}
              registration={form.register('type')}
              error={form.formState.errors.type?.message}
            />
          )}

          {/* Pago não volta a pendente (a API recusa); para desfazer, cancele a transação. */}
          {editableStatus && status && transaction?.status !== 'PAID' && (
            <SegmentedRadio
              legend="Status"
              className="md:max-w-[320px]"
              options={statusOptions}
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
      {ruleDialog}
    </>
  )
}
