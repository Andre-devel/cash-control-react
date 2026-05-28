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
      targetBalance: account?.balance ?? '0.00',
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
      title={`Adjust Balance — ${account?.name}`}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
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
                Adjusting…
              </>
            ) : (
              'Adjust Balance'
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
        <Field label="Target Balance" error={form.formState.errors.targetBalance?.message}>
          <Input placeholder="e.g. 2500.00" {...form.register('targetBalance')} />
        </Field>

        <Field label="Note (optional)" error={form.formState.errors.note?.message}>
          <Textarea
            placeholder="e.g. Reconciliation with bank statement"
            {...form.register('note')}
          />
        </Field>
      </form>
    </Modal>
  )
}
