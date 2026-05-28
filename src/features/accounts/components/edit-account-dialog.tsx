import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CASH: 'Cash',
  INVESTMENT: 'Investment',
  CREDIT: 'Credit',
  OTHER: 'Other',
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
      currency: 'BRL',
      balance: '0.00',
      color: '#4CAF50',
      icon: 'wallet',
    },
  })

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance: account.balance,
        color: account.color,
        icon: account.icon,
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
      title="Edit Account"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
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
                Saving…
              </>
            ) : (
              'Save Changes'
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
        <Field label="Name" error={form.formState.errors.name?.message}>
          <Input placeholder="e.g. Nubank" {...form.register('name')} />
        </Field>

        <Field label="Type" error={form.formState.errors.type?.message}>
          <Select aria-label="Type" {...form.register('type')}>
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {ACCOUNT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Currency" error={form.formState.errors.currency?.message}>
          <Input placeholder="e.g. BRL" {...form.register('currency')} />
        </Field>

        <Field label="Balance" error={form.formState.errors.balance?.message}>
          <Input placeholder="e.g. 1500.00" {...form.register('balance')} />
        </Field>

        <Field label="Color" error={form.formState.errors.color?.message}>
          <Input placeholder="#4CAF50" {...form.register('color')} />
        </Field>

        <Field label="Icon" error={form.formState.errors.icon?.message}>
          <Input placeholder="e.g. wallet" {...form.register('icon')} />
        </Field>
      </form>
    </Modal>
  )
}
