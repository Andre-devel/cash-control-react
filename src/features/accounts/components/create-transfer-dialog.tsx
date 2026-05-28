import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  createTransferSchema,
  type CreateTransferFormValues,
} from '@/features/accounts/schemas/create-transfer.schema'
import { useCreateTransfer } from '@/features/accounts/hooks/use-create-transfer'
import type { Account } from '@/features/accounts/types'

interface CreateTransferDialogProps {
  defaultFromAccount: Account | null
  accounts: Account[]
  open: boolean
  onClose: () => void
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CreateTransferDialog({
  defaultFromAccount,
  accounts,
  open,
  onClose,
}: CreateTransferDialogProps) {
  const { mutate: createTransfer, isPending } = useCreateTransfer()

  const activeAccounts = accounts.filter((a) => !a.archived)

  const form = useForm<CreateTransferFormValues>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      fromAccountId: defaultFromAccount?.id ?? '',
      toAccountId: '',
      amount: '',
      date: todayIso(),
      description: '',
    },
  })

  function onSubmit(data: CreateTransferFormValues) {
    createTransfer(data, {
      onSuccess: () => {
        form.reset()
        onClose()
      },
    })
  }

  function handleClose() {
    form.reset()
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Transfer Between Accounts"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="create-transfer-form"
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
                Transferring…
              </>
            ) : (
              'Transfer'
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-transfer-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="From Account" error={form.formState.errors.fromAccountId?.message}>
          <Select aria-label="From Account" {...form.register('fromAccountId')}>
            <option value="">Select source account</option>
            {activeAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency} {acc.balance})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="To Account" error={form.formState.errors.toAccountId?.message}>
          <Select aria-label="To Account" {...form.register('toAccountId')}>
            <option value="">Select destination account</option>
            {activeAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency} {acc.balance})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Amount" error={form.formState.errors.amount?.message}>
          <Input placeholder="e.g. 500.00" {...form.register('amount')} />
        </Field>

        <Field label="Date" error={form.formState.errors.date?.message}>
          <Input type="date" {...form.register('date')} />
        </Field>

        <Field label="Description (optional)" error={form.formState.errors.description?.message}>
          <Input placeholder="e.g. Savings contribution" {...form.register('description')} />
        </Field>
      </form>
    </Modal>
  )
}
