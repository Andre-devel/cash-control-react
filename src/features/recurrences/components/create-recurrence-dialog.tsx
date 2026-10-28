import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  createRecurrenceSchema,
  RECURRENCE_FREQUENCIES,
  RECURRENCE_TYPES,
  FREQUENCY_LABELS,
  type CreateRecurrenceFormValues,
} from '@/features/recurrences/schemas/create-recurrence.schema'
import { useCreateRecurrence } from '@/features/recurrences/hooks/use-create-recurrence'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { setFormErrors } from '@/lib/form-errors'
import { localIsoDate } from '@/lib/local-date'
import { PaymentMethodSelect } from '@/features/transactions/components/payment-method-select'
import { CreditCardSelect } from '@/features/transactions/components/credit-card-select'
import { useCards } from '@/features/cards/hooks/use-cards'

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  REFUND: 'Reembolso',
}

function defaultValues(): CreateRecurrenceFormValues {
  return {
    description: '',
    amount: '',
    frequency: 'MONTHLY',
    type: 'EXPENSE',
    accountId: '',
    categoryId: '',
    startDate: localIsoDate(),
    endDate: '',
    paymentMethod: 'OTHER',
    creditCardId: '',
  }
}

interface CreateRecurrenceDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateRecurrenceDialog({ open, onClose }: CreateRecurrenceDialogProps) {
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { data: allCards = [] } = useCards()
  const cards = allCards.filter((c) => !c.archivedAt)

  const form = useForm<CreateRecurrenceFormValues>({
    resolver: zodResolver(createRecurrenceSchema),
    defaultValues: defaultValues(),
  })
  const paymentMethod = form.watch('paymentMethod')
  const { mutate: createRecurrence, isPending } = useCreateRecurrence({
    onFieldError: (error) => setFormErrors(error, form.setError),
  })

  function onSubmit(data: CreateRecurrenceFormValues) {
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
      endDate: data.endDate || undefined,
      creditCardId: data.creditCardId || undefined,
    }
    createRecurrence(payload, {
      onSuccess: () => {
        form.reset(defaultValues())
        onClose()
      },
    })
  }

  function handleClose() {
    form.reset(defaultValues())
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Nova regra de recorrência"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="create-recurrence-form"
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
              'Criar regra'
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-recurrence-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        {form.formState.errors.root && (
          <div role="alert" className="err">
            {form.formState.errors.root.message}
          </div>
        )}
        <Field label="Descrição" error={form.formState.errors.description?.message}>
          <Input placeholder="ex: Aluguel mensal" {...form.register('description')} />
        </Field>

        <Field label="Valor" error={form.formState.errors.amount?.message}>
          <MoneyInput placeholder="ex: 1500,00" {...form.register('amount')} />
        </Field>

        <Field label="Tipo" error={form.formState.errors.type?.message}>
          <Select aria-label="Tipo" {...form.register('type')}>
            {RECURRENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Frequência" error={form.formState.errors.frequency?.message}>
          <Select aria-label="Frequência" {...form.register('frequency')}>
            {RECURRENCE_FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>
                {FREQUENCY_LABELS[freq]}
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

        <Controller
          control={form.control}
          name="paymentMethod"
          render={({ field, fieldState }) => (
            <Field label="Forma de pagamento" error={fieldState.error?.message}>
              <PaymentMethodSelect
                value={field.value ?? 'OTHER'}
                onChange={(value) => {
                  field.onChange(value)
                  if (value !== 'CREDIT_CARD') form.setValue('creditCardId', '')
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
              <Field
                label="Cartão de crédito"
                hint="As ocorrências entram nas faturas do cartão."
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

        <Field
          label="Data de início"
          hint="Ocorrências com data passada entram como pendentes; confirme o pagamento de cada uma."
          error={form.formState.errors.startDate?.message}
        >
          <Input type="date" aria-label="Data de início" {...form.register('startDate')} />
        </Field>

        <Field
          label="Data de fim (opcional)"
          hint="Sem data de fim, a recorrência continua até ser pausada ou excluída."
          error={form.formState.errors.endDate?.message}
        >
          <Input type="date" aria-label="Data de fim" {...form.register('endDate')} />
        </Field>
      </form>
    </Modal>
  )
}
