import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  updateAccountSchema,
  type UpdateAccountFormValues,
} from '@/features/accounts/schemas/update-account.schema'
import { ACCOUNT_TYPES } from '@/features/accounts/schemas/create-account.schema'
import { useUpdateAccount } from '@/features/accounts/hooks/use-update-account'
import type { Account } from '@/features/accounts/types'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Poupança',
  CASH: 'Carteira',
  INVESTMENT: 'Investimento',
  CREDIT: 'Crédito',
  OTHER: 'Outros',
}

interface EditAccountDialogProps {
  account: Account | null
  open: boolean
  onClose: () => void
}

export function EditAccountDialog({ account, open, onClose }: EditAccountDialogProps) {
  const { mutate: updateAccount, isPending } = useUpdateAccount()

  const form = useForm<UpdateAccountFormValues>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: {
      name: '',
      type: 'CHECKING',
      currencyCode: 'BRL',
      description: '',
    },
  })

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        type: account.type,
        currencyCode: account.currencyCode,
        description: account.description ?? '',
      })
    }
  }, [account, form])

  function onSubmit(data: UpdateAccountFormValues) {
    if (!account) return
    updateAccount(
      { id: account.id, data },
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
      title="Editar conta"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="edit-account-form"
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
        id="edit-account-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
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

        <Field label="Descrição (opcional)" error={form.formState.errors.description?.message}>
          <Textarea placeholder="ex: Conta principal de gastos" {...form.register('description')} />
        </Field>
      </form>
    </Modal>
  )
}
