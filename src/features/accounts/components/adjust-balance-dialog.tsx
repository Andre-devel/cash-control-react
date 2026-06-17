import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import {
  adjustBalanceSchema,
  type AdjustBalanceFormValues,
} from '@/features/accounts/schemas/adjust-balance.schema'
import { useAdjustBalance } from '@/features/accounts/hooks/use-adjust-balance'
import type { Account } from '@/features/accounts/types'

interface AdjustBalanceDialogProps {
  account: Account | null
  open: boolean
  onClose: () => void
}

export function AdjustBalanceDialog({ account, open, onClose }: AdjustBalanceDialogProps) {
  const { mutate: adjustBalance, isPending } = useAdjustBalance()

  const form = useForm<AdjustBalanceFormValues>({
    resolver: zodResolver(adjustBalanceSchema),
    defaultValues: {
      amount: '',
      note: '',
    },
  })

  function onSubmit(data: AdjustBalanceFormValues) {
    if (!account) return
    adjustBalance(
      { id: account.id, data },
      {
        onSuccess: () => {
          form.reset()
          onClose()
        },
      },
    )
  }

  function handleClose() {
    form.reset()
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title={`Ajustar saldo — ${account?.name}`}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="adjust-balance-form"
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
                Ajustando…
              </>
            ) : (
              'Ajustar saldo'
            )}
          </Button>
        </>
      }
    >
      <form
        id="adjust-balance-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Valor do ajuste" error={form.formState.errors.amount?.message}>
          <Input placeholder="ex: 100.00 ou -50.00" {...form.register('amount')} />
        </Field>

        <Field label="Observação (opcional)" error={form.formState.errors.note?.message}>
          <Textarea placeholder="ex: Conciliação com extrato bancário" {...form.register('note')} />
        </Field>
      </form>
    </Modal>
  )
}
