import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import {
  adjustBalanceSchema,
  adjustmentDelta,
  type AdjustBalanceFormValues,
} from '@/features/accounts/schemas/adjust-balance.schema'
import { useAdjustBalance } from '@/features/accounts/hooks/use-adjust-balance'
import type { Account } from '@/features/accounts/types'
import { formatMoney } from '@/lib/money'

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
      targetBalance: '',
      description: '',
    },
  })

  function onSubmit(data: AdjustBalanceFormValues) {
    if (!account) return
    const amount = adjustmentDelta(account.balance, data.targetBalance)
    if (Number(amount) === 0) {
      form.setError('targetBalance', { message: 'O novo saldo é igual ao saldo atual' })
      return
    }
    adjustBalance(
      { id: account.id, data: { amount, description: data.description || undefined } },
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
          <Button type="submit" form="adjust-balance-form" variant="primary" loading={isPending}>
            {isPending ? 'Ajustando…' : 'Ajustar saldo'}
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
        <p className="text-sm text-dim">
          Saldo atual:{' '}
          <strong className="mono">
            {formatMoney(account?.balance ?? 0, account?.currencyCode)}
          </strong>
        </p>

        <Field
          label="Novo saldo"
          hint="Informe o saldo que o banco mostra; a diferença vira um lançamento de ajuste."
          error={form.formState.errors.targetBalance?.message}
        >
          <MoneyInput placeholder="ex: 1.250,40" {...form.register('targetBalance')} />
        </Field>

        <Field label="Observação (opcional)" error={form.formState.errors.description?.message}>
          <Textarea
            placeholder="ex: Conciliação com extrato bancário"
            {...form.register('description')}
          />
        </Field>
      </form>
    </Modal>
  )
}
