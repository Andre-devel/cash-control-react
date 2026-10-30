import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import { MoneyInput } from '@/components/ui/money-input'
import { Select } from '@/components/ui/select'
import { useDebounce } from '@/hooks/use-debounce'
import type { Account } from '@/features/accounts/types'
import { useRedeemHolding } from '@/features/investments/hooks/use-holding-mutations'
import { useRedemptionPreview } from '@/features/investments/hooks/use-investments'
import { redeemSchema, type RedeemFormValues } from '@/features/investments/schemas/redeem.schema'
import type {
  FixedIncomeHolding,
  PendingInvestmentTransfer,
  RedemptionPreviewParams,
} from '@/features/investments/types'
import { formatPercent, toNumber } from '@/features/investments/utils/labels'
import { formatLocalDate } from '@/lib/format-date'
import { localIsoDate } from '@/lib/local-date'
import { formatMoney, normalizeMoneyInput } from '@/lib/money'

interface RedeemDialogProps {
  holding: FixedIncomeHolding | null
  accounts: Account[]
  onClose: () => void
  /** Resgate que já veio do extrato: a transferência dá o líquido e o destino. */
  transfer?: PendingInvestmentTransfer | null
}

const STAY = 'STAY'

export function RedeemDialog({ holding, accounts, onClose, transfer }: RedeemDialogProps) {
  if (!holding) return null
  return <RedeemForm holding={holding} accounts={accounts} onClose={onClose} transfer={transfer} />
}

function RedeemForm({
  holding,
  accounts,
  onClose,
  transfer,
}: { holding: FixedIncomeHolding } & Omit<RedeemDialogProps, 'holding'>) {
  const destinations = accounts.filter((a) => !a.archivedAt && a.id !== holding.accountId)
  const { mutate: redeem, isPending } = useRedeemHolding()
  const form = useForm<RedeemFormValues>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      date: transfer?.date ?? localIsoDate(),
      mode: 'TOTAL',
      grossAmount: '',
      destination: destinations.find((a) => a.type === 'CHECKING')?.id ?? STAY,
      netAmount: '',
    },
  })
  const [date, mode, grossAmount] = form.watch(['date', 'mode', 'grossAmount'])
  const errors = form.formState.errors

  const normalizedGross = normalizeMoneyInput(grossAmount)
  const previewParams = useDebounce<RedemptionPreviewParams | null>(
    !date
      ? null
      : mode === 'TOTAL'
        ? { date, total: true }
        : /^\d+(\.\d{1,2})?$/.test(normalizedGross) && Number(normalizedGross) > 0
          ? { date, total: false, grossAmount: normalizedGross }
          : null,
    400,
  )
  const {
    data: preview,
    isFetching,
    error: previewError,
  } = useRedemptionPreview(holding.id, previewParams)

  function onSubmit(values: RedeemFormValues) {
    redeem(
      {
        id: holding.id,
        data: {
          date: values.date,
          total: values.mode === 'TOTAL',
          grossAmount: values.mode === 'PARTIAL' ? normalizeMoneyInput(values.grossAmount) : null,
          netAmount: !transfer && values.netAmount ? normalizeMoneyInput(values.netAmount) : null,
          toAccountId: transfer || values.destination === STAY ? null : values.destination,
          transferGroupId: transfer?.transferGroupId ?? null,
        },
      },
      { onSuccess: () => onClose() },
    )
  }

  const maxGross = holding.valuation ? toNumber(holding.valuation.gross) : 0

  return (
    <Modal
      title="Resgatar"
      subtitle={holding.name}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button type="submit" form="redeem-form" variant="primary" loading={isPending}>
            Registrar resgate
          </Button>
        </>
      }
    >
      <form
        id="redeem-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <fieldset className="col gap-2">
          <legend className="mb-1 text-body-sm font-semibold text-fg">Quanto resgatar</legend>
          <label className="flex items-center gap-2 text-body-sm text-fg">
            <input type="radio" value="TOTAL" {...form.register('mode')} />
            Tudo
          </label>
          <label className="flex items-center gap-2 text-body-sm text-fg">
            <input type="radio" value="PARTIAL" {...form.register('mode')} />
            Uma parte
          </label>
        </fieldset>

        {mode === 'PARTIAL' && (
          <Field
            label="Valor bruto a resgatar"
            hint={`Disponível hoje: ${formatMoney(maxGross)} bruto.`}
            error={errors.grossAmount?.message}
          >
            <MoneyInput placeholder="ex: 500,00" {...form.register('grossAmount')} />
          </Field>
        )}

        <Field label="Data do resgate" error={errors.date?.message}>
          <Input
            type="date"
            min={holding.appliedAt}
            max={localIsoDate()}
            {...form.register('date')}
          />
        </Field>

        <section
          aria-label="Prévia do resgate"
          aria-busy={isFetching}
          className="rounded-xl border border-border bg-surface-2 p-3"
        >
          {previewError ? (
            <p className="text-body-sm text-expense">
              {(previewError as { message?: string }).message}
            </p>
          ) : preview ? (
            <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1.5 text-body-sm">
              <dt className="text-fg-muted">Bruto</dt>
              <dd className="m-0 text-right tabular-nums">
                <Money value={toNumber(preview.gross)} />
              </dd>
              <dt className="text-fg-muted">IOF ({formatPercent(preview.iofRate, 0)})</dt>
              <dd className="m-0 text-right tabular-nums">
                <Money value={-toNumber(preview.iof)} />
              </dd>
              <dt className="text-fg-muted">IR ({formatPercent(preview.incomeTaxRate, 1)})</dt>
              <dd className="m-0 text-right tabular-nums">
                <Money value={-toNumber(preview.incomeTax)} />
              </dd>
              <dt className="font-semibold text-fg">Líquido</dt>
              <dd className="m-0 text-right font-semibold tabular-nums">
                <Money value={toNumber(preview.net)} />
              </dd>
              <dt className="text-fg-muted">Rendimento</dt>
              <dd className="m-0 text-right tabular-nums">
                <Money value={toNumber(preview.net) - toNumber(preview.principal)} signed />
              </dd>
            </dl>
          ) : (
            <p className="text-body-sm text-fg-muted">
              {mode === 'PARTIAL' ? 'Informe o valor para ver a prévia.' : 'Calculando…'}
            </p>
          )}
          {preview?.estimated && (
            <p className="mt-2 text-caption text-fg-muted">
              Estimativa: algum índice do período ainda não foi publicado.
            </p>
          )}
        </section>

        {transfer ? (
          <p className="rounded-xl border border-border bg-surface-1 p-3 text-body-sm text-fg">
            Vinculado à transferência do extrato de {formatLocalDate(transfer.date)}:{' '}
            <strong>
              <Money value={toNumber(transfer.amount)} />
            </strong>{' '}
            {transfer.counterpartAccountName ? `para ${transfer.counterpartAccountName}` : ''}. É
            esse o líquido registrado; a diferença para a prévia vira rendimento.
          </p>
        ) : (
          <>
            <Field label="Para onde vai o dinheiro" error={errors.destination?.message}>
              <Select aria-label="Conta de destino" {...form.register('destination')}>
                <option value={STAY}>Fica na conta de investimento</option>
                {destinations.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Valor líquido recebido (opcional)"
              hint="Preencha se o banco pagou um valor diferente da prévia; é ele que entra na conta."
              error={errors.netAmount?.message}
            >
              <MoneyInput placeholder="ex: 1.061,10" {...form.register('netAmount')} />
            </Field>
          </>
        )}
      </form>
    </Modal>
  )
}
