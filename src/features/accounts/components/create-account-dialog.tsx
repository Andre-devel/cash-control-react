import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  createAccountSchema,
  ACCOUNT_TYPES,
  type CreateAccountFormValues,
} from '@/features/accounts/schemas/create-account.schema'
import { useCreateAccount } from '@/features/accounts/hooks/use-create-account'
import { setFormErrors } from '@/lib/form-errors'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Poupança',
  CASH: 'Carteira',
  INVESTMENT: 'Investimento',
  CREDIT: 'Crédito',
  OTHER: 'Outros',
}

const DEFAULT_VALUES: CreateAccountFormValues = {
  name: '',
  type: 'CHECKING',
  currencyCode: 'BRL',
  initialBalance: '0.00',
  description: '',
}

interface CreateAccountDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateAccountDialog({ open, onClose }: CreateAccountDialogProps) {
  const form = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { mutate: createAccount, isPending } = useCreateAccount({
    onFieldError: (error) => setFormErrors(error, form.setError),
  })

  function onSubmit(data: CreateAccountFormValues) {
    createAccount(
      { ...data, initialBalance: data.initialBalance || undefined },
      {
        onSuccess: () => {
          form.reset(DEFAULT_VALUES)
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
      title="Nova conta"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="create-account-form"
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
              'Criar conta'
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-account-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        {form.formState.errors.root && (
          <div role="alert" className="err">
            {form.formState.errors.root.message}
          </div>
        )}
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input placeholder="ex: Nubank" {...form.register('name')} />
        </Field>

        <Field label="Tipo" error={form.formState.errors.type?.message}>
          <Select aria-label="Tipo" {...form.register('type')}>
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {ACCOUNT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Moeda" error={form.formState.errors.currencyCode?.message}>
          <Input placeholder="ex: BRL" {...form.register('currencyCode')} />
        </Field>

        <Field label="Saldo inicial" error={form.formState.errors.initialBalance?.message}>
          <Input placeholder="ex: 1500.00" {...form.register('initialBalance')} />
        </Field>

        <Field label="Descrição (opcional)" error={form.formState.errors.description?.message}>
          <Textarea placeholder="ex: Conta principal de gastos" {...form.register('description')} />
        </Field>
      </form>
    </Modal>
  )
}
