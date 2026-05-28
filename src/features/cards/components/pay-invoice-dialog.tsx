import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { MoneyInput } from '@/components/ui/money-input'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Money } from '@/components/ui/money'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import {
  createPayInvoiceSchema,
  type PayInvoiceFormValues,
} from '@/features/cards/schemas/pay-invoice.schema'
import { usePayInvoice } from '@/features/cards/hooks/use-pay-invoice'
import type { Invoice } from '@/features/cards/types'

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function toDecimalString(value: number): string {
  return value.toFixed(2)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

interface MiniStatProps {
  label: string
  value: number
  tone?: 'pending' | 'paid' | ''
}

function MiniStat({ label, value, tone }: MiniStatProps) {
  const color =
    tone === 'pending' ? 'var(--pending)' : tone === 'paid' ? 'var(--paid)' : 'var(--text)'
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--surface-2)',
        borderRadius: 8,
        border: '1px solid var(--border)',
      }}
    >
      <div className="text-xs text-dim">{label}</div>
      <div className="text-lg mono fw-500 mt-2" style={{ color }}>
        <Money value={value} />
      </div>
    </div>
  )
}

interface PayInvoiceDialogProps {
  invoice: Invoice
  cardName: string
  open: boolean
  onClose: () => void
}

export function PayInvoiceDialog({ invoice, cardName, open, onClose }: PayInvoiceDialogProps) {
  const { mutate: payInvoice, isPending } = usePayInvoice()
  const { data: accounts } = useAccounts()

  const totalAmount = parseFloat(invoice.totalAmount)
  const paidAmount = parseFloat(invoice.paidAmount)
  const remainingAmount = parseFloat(invoice.remainingAmount)

  const schema = createPayInvoiceSchema(invoice.remainingAmount)
  const form = useForm<PayInvoiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: invoice.remainingAmount,
      accountId: '',
    },
  })

  function onSubmit(data: PayInvoiceFormValues) {
    payInvoice(
      { invoiceId: invoice.id, data },
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
      title={`Pagar fatura · ${cardName}`}
      subtitle={`Vence em ${fmtDate(invoice.dueDate)}`}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="pay-invoice-form"
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
                Processando…
              </>
            ) : (
              'Confirmar pagamento'
            )}
          </Button>
        </>
      }
    >
      <form
        id="pay-invoice-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        {/* Mini stats */}
        <div className="grid grid-3" style={{ marginBottom: 8 }}>
          <MiniStat label="Total da fatura" value={totalAmount} tone="" />
          <MiniStat label="Já pago" value={paidAmount} tone="paid" />
          <MiniStat label="Restante" value={remainingAmount} tone="pending" />
        </div>

        <Field
          label="Valor a pagar"
          required
          hint="Pagamento parcial ou total"
          error={form.formState.errors.amount?.message}
        >
          <MoneyInput placeholder="0,00" {...form.register('amount')} />
        </Field>

        {/* Quick preset buttons */}
        <div className="row gap-2">
          <Button
            size="sm"
            type="button"
            onClick={() =>
              form.setValue('amount', invoice.remainingAmount, { shouldValidate: true })
            }
          >
            Pagar tudo
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() =>
              form.setValue('amount', toDecimalString(remainingAmount / 2), {
                shouldValidate: true,
              })
            }
          >
            50%
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() =>
              form.setValue('amount', toDecimalString(totalAmount * 0.15), {
                shouldValidate: true,
              })
            }
          >
            Mínimo (15%)
          </Button>
        </div>

        <Field label="Conta de origem" required error={form.formState.errors.accountId?.message}>
          <Select aria-label="Conta de origem" {...form.register('accountId')}>
            <option value="">Selecionar conta</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Data do pagamento" required>
          <Input type="date" defaultValue={todayIso()} />
        </Field>
      </form>
    </Modal>
  )
}
