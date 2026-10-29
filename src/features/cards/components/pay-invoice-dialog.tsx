import { useEffect } from 'react'
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
import { localIsoDate, parseLocalDate } from '@/lib/local-date'

function fmtDate(dateStr: string) {
  const d = parseLocalDate(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function toDecimalString(value: number): string {
  return value.toFixed(2)
}

function todayIso(): string {
  return localIsoDate()
}

interface MiniStatProps {
  label: string
  value: number
  tone?: 'pending' | 'paid' | ''
}

const TONE_CLASS = { pending: 'text-pending', paid: 'text-paid', '': 'text-fg' } as const

function MiniStat({ label, value, tone = '' }: MiniStatProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] text-fg-muted">{label}</span>
      <span className={`truncate text-body-sm font-semibold tabular-nums ${TONE_CLASS[tone]}`}>
        <Money value={value} />
      </span>
    </div>
  )
}

/** Atalhos de valor: mesmo comportamento de antes, com cara de segmentado. */
const PRESET_CLASS =
  'min-h-touch flex-1 rounded-sm border-0 bg-transparent px-2 text-body-sm font-semibold text-fg-muted transition-colors hover:bg-surface-1 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

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
  const remainingAmount = totalAmount - paidAmount
  const remainingAmountStr = remainingAmount.toFixed(2)

  const schema = createPayInvoiceSchema(remainingAmountStr)
  const form = useForm<PayInvoiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: remainingAmountStr,
      sourceAccountId: '',
      paymentDate: todayIso(),
    },
  })

  // O formulário fica montado entre aberturas: sem isto, depois de um pagamento parcial ele
  // voltava com o total de quando foi montado, não com o restante.
  useEffect(() => {
    if (open) {
      form.reset({ amount: remainingAmountStr, sourceAccountId: '', paymentDate: todayIso() })
    }
  }, [open, remainingAmountStr, form])

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
          <Button type="submit" form="pay-invoice-form" variant="primary" loading={isPending}>
            {isPending ? 'Processando…' : 'Confirmar pagamento'}
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
        {/* Resumo: o restante em destaque, total e já pago ao lado. */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-4">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Total da fatura" value={totalAmount} />
            <MiniStat label="Já pago" value={paidAmount} tone="paid" />
            <MiniStat label="Restante" value={remainingAmount} tone="pending" />
          </div>
        </div>

        <Field
          label="Valor a pagar"
          required
          hint="Pagamento parcial ou total"
          error={form.formState.errors.amount?.message}
        >
          <MoneyInput
            placeholder="0,00"
            style={{ fontSize: 22, fontWeight: 700 }}
            {...form.register('amount')}
          />
        </Field>

        {/* Atalhos de valor */}
        <div
          className="-mt-1 flex gap-1 rounded-md bg-surface-2 p-1"
          role="group"
          aria-label="Atalhos de valor"
        >
          <button
            type="button"
            className={PRESET_CLASS}
            onClick={() => form.setValue('amount', remainingAmountStr, { shouldValidate: true })}
          >
            Pagar tudo
          </button>
          <button
            type="button"
            className={PRESET_CLASS}
            onClick={() =>
              form.setValue('amount', toDecimalString(remainingAmount / 2), {
                shouldValidate: true,
              })
            }
          >
            50%
          </button>
          <button
            type="button"
            className={PRESET_CLASS}
            onClick={() =>
              form.setValue('amount', toDecimalString(totalAmount * 0.15), {
                shouldValidate: true,
              })
            }
          >
            Mínimo (15%)
          </button>
        </div>

        <Field
          label="Conta de origem"
          required
          error={form.formState.errors.sourceAccountId?.message}
        >
          <Select aria-label="Conta de origem" {...form.register('sourceAccountId')}>
            <option value="">Selecionar conta</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Data do pagamento"
          required
          error={form.formState.errors.paymentDate?.message}
        >
          <Input type="date" {...form.register('paymentDate')} />
        </Field>
      </form>
    </Modal>
  )
}
