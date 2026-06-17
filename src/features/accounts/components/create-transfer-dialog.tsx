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

  const activeAccounts = accounts.filter((a) => !a.archivedAt)

  const form = useForm<CreateTransferFormValues>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      sourceAccountId: defaultFromAccount?.id ?? '',
      destinationAccountId: '',
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
      title="Transferir entre contas"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
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
                Transferindo…
              </>
            ) : (
              'Transferir'
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
        <Field label="Conta de origem" error={form.formState.errors.sourceAccountId?.message}>
          <Select aria-label="Conta de origem" {...form.register('sourceAccountId')}>
            <option value="">Selecionar conta de origem</option>
            {activeAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currencyCode} {acc.balance})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Conta de destino" error={form.formState.errors.destinationAccountId?.message}>
          <Select aria-label="Conta de destino" {...form.register('destinationAccountId')}>
            <option value="">Selecionar conta de destino</option>
            {activeAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currencyCode} {acc.balance})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Valor" error={form.formState.errors.amount?.message}>
          <Input placeholder="ex: 500.00" {...form.register('amount')} />
        </Field>

        <Field label="Data" error={form.formState.errors.date?.message}>
          <Input type="date" {...form.register('date')} />
        </Field>

        <Field label="Descrição (opcional)" error={form.formState.errors.description?.message}>
          <Input placeholder="ex: Aporte em poupança" {...form.register('description')} />
        </Field>
      </form>
    </Modal>
  )
}
