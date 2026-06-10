import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  createInstallmentSchema,
  type CreateInstallmentFormValues,
} from '@/features/installments/schemas/create-installment.schema'
import { useCreateInstallment } from '@/features/installments/hooks/use-create-installment'
import { setFormErrors } from '@/lib/form-errors'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'

const DEFAULT_VALUES: CreateInstallmentFormValues = {
  description: '',
  totalAmount: '0.00',
  totalInstallments: 2,
  accountId: '',
  categoryId: '',
  firstPaymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'OTHER',
  creditCardId: '',
}

interface CreateInstallmentDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateInstallmentDialog({ open, onClose }: CreateInstallmentDialogProps) {
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()

  const form = useForm<CreateInstallmentFormValues>({
    resolver: zodResolver(createInstallmentSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { mutate: createInstallment, isPending } = useCreateInstallment({
    onFieldError: (error) => setFormErrors(error, form.setError),
  })

  const description = form.watch('description')

  function onSubmit(data: CreateInstallmentFormValues) {
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
    }
    createInstallment(payload, {
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
      title="Nova série de parcelamentos"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="create-installment-form"
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
              'Criar série'
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-installment-form"
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
          <Input placeholder="ex: Notebook novo" {...form.register('description')} />
        </Field>

        <Field label="Valor total" error={form.formState.errors.totalAmount?.message}>
          <Input placeholder="ex: 3600.00" {...form.register('totalAmount')} />
        </Field>

        <Field label="Número de parcelas" error={form.formState.errors.totalInstallments?.message}>
          <Input
            type="number"
            min={2}
            placeholder="ex: 12"
            {...form.register('totalInstallments', { valueAsNumber: true })}
          />
        </Field>

        <Field label="Conta" error={form.formState.errors.accountId?.message}>
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
          label="Data do primeiro pagamento"
          error={form.formState.errors.firstPaymentDate?.message}
        >
          <Input type="date" {...form.register('firstPaymentDate')} />
        </Field>
      </form>
    </Modal>
  )
}
