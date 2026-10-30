import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { MoneyInput } from '@/components/ui/money-input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Account } from '@/features/accounts/types'
import {
  useCreateHolding,
  useUpdateHolding,
} from '@/features/investments/hooks/use-holding-mutations'
import { useTreasuryBonds } from '@/features/investments/hooks/use-investments'
import {
  holdingSchema,
  parseTreasuryBondValue,
  treasuryBondValue,
  type HoldingFormInput,
  type HoldingFormValues,
} from '@/features/investments/schemas/holding.schema'
import type { FixedIncomeHolding, HoldingRequest } from '@/features/investments/types'
import { INDEXER_LABELS, KIND_LABELS, toNumber } from '@/features/investments/utils/labels'
import { localIsoDate } from '@/lib/local-date'
import { formatLocalDate } from '@/lib/format-date'
import { formatMoney, formatMoneyInput } from '@/lib/money'

interface HoldingFormDialogProps {
  open: boolean
  onClose: () => void
  accounts: Account[]
  /** Edição quando presente. */
  holding?: FixedIncomeHolding | null
  /** Cadastro do saldo não alocado: conta e valor já preenchidos, sem transferência. */
  prefill?: { accountId: string; principal: number } | null
}

const RATE_HINTS: Record<string, string> = {
  CDI_PERCENT: 'Percentual do CDI: 110 para 110% do CDI.',
  SELIC_PERCENT: 'Percentual da Selic: 100 para 100% da Selic.',
  CDI_SPREAD: 'Taxa ao ano somada ao CDI: 1,5 para CDI + 1,5%.',
  PREFIXED: 'Taxa ao ano: 12,5 para 12,5% a.a.',
  IPCA_SPREAD: 'Juro real ao ano: 6,2 para IPCA + 6,2%.',
}

function defaults(
  holding: FixedIncomeHolding | null | undefined,
  prefill: HoldingFormDialogProps['prefill'],
  investmentAccounts: Account[],
): HoldingFormInput {
  if (holding) {
    return {
      accountId: holding.accountId,
      kind: holding.kind,
      indexer: holding.indexer ?? '',
      rate: holding.rate === null ? '' : String(holding.rate).replace('.', ','),
      name: holding.name,
      issuer: holding.issuer ?? '',
      taxExempt: holding.taxExempt,
      liquidity: holding.liquidity,
      appliedAt: holding.appliedAt,
      maturityDate: holding.maturityDate ?? '',
      principal: formatMoneyInput(holding.principal),
      treasuryBond:
        holding.treasuryBondType && holding.maturityDate
          ? treasuryBondValue(holding.treasuryBondType, holding.maturityDate)
          : '',
      treasuryQuantity:
        holding.treasuryQuantity === null ? '' : String(holding.treasuryQuantity).replace('.', ','),
      funding: 'EXISTING',
      fromAccountId: '',
      notes: holding.notes ?? '',
    }
  }
  return {
    accountId:
      prefill?.accountId ?? (investmentAccounts.length === 1 ? investmentAccounts[0].id : ''),
    kind: 'CDB',
    indexer: 'CDI_PERCENT',
    rate: '',
    name: '',
    issuer: '',
    taxExempt: false,
    liquidity: 'DAILY',
    appliedAt: localIsoDate(),
    maturityDate: '',
    principal: prefill ? formatMoneyInput(prefill.principal) : '',
    treasuryBond: '',
    treasuryQuantity: '',
    funding: prefill ? 'EXISTING' : 'TRANSFER',
    fromAccountId: '',
    notes: '',
  }
}

function toRequest(values: HoldingFormValues, editing: boolean): HoldingRequest {
  const treasury =
    values.kind === 'TESOURO_DIRETO' && values.treasuryBond
      ? parseTreasuryBondValue(values.treasuryBond)
      : null
  return {
    accountId: values.accountId,
    kind: values.kind,
    indexer: treasury ? null : values.indexer || null,
    rate: treasury || !values.indexer ? null : values.rate,
    name: values.name,
    issuer: values.issuer.trim() || null,
    taxExempt: values.kind === 'OTHER' ? values.taxExempt : undefined,
    liquidity: values.liquidity,
    appliedAt: values.appliedAt,
    maturityDate: treasury ? treasury.maturityDate : values.maturityDate || null,
    principal: values.principal,
    treasuryBondType: treasury?.bondType ?? null,
    treasuryQuantity: treasury && values.treasuryQuantity ? values.treasuryQuantity : null,
    fromAccountId: !editing && values.funding === 'TRANSFER' ? values.fromAccountId : null,
    notes: values.notes.trim() || null,
  }
}

export function HoldingFormDialog({
  open,
  onClose,
  accounts,
  holding,
  prefill,
}: HoldingFormDialogProps) {
  const editing = Boolean(holding)
  const activeAccounts = accounts.filter((a) => !a.archivedAt)
  const investmentAccounts = activeAccounts.filter((a) => a.type === 'INVESTMENT')
  const otherAccounts = activeAccounts.filter((a) => a.type !== 'INVESTMENT')

  const { mutate: create, isPending: creating } = useCreateHolding()
  const { mutate: update, isPending: updating } = useUpdateHolding()

  const form = useForm<HoldingFormInput, unknown, HoldingFormValues>({
    resolver: zodResolver(holdingSchema),
    values: open ? defaults(holding, prefill, investmentAccounts) : undefined,
  })
  const kind = form.watch('kind')
  const indexer = form.watch('indexer')
  const funding = form.watch('funding')
  const isTreasury = kind === 'TESOURO_DIRETO'
  const { data: bonds, isLoading: bondsLoading } = useTreasuryBonds(open && isTreasury)
  const errors = form.formState.errors
  const locked = editing && (holding?.redemptions.length ?? 0) > 0

  function onSubmit(values: HoldingFormValues) {
    const request = toRequest(values, editing)
    const options = { onSuccess: () => onClose() }
    if (holding) {
      update({ id: holding.id, data: request }, options)
    } else {
      create(request, options)
    }
  }

  if (!open) return null

  return (
    <Modal
      title={editing ? 'Editar aplicação' : 'Nova aplicação'}
      subtitle={editing ? holding?.name : 'Renda fixa: CDB, LCI, LCA ou Tesouro Direto'}
      onClose={onClose}
      panel
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="holding-form"
            variant="primary"
            loading={creating || updating}
          >
            {editing ? 'Salvar' : 'Registrar aplicação'}
          </Button>
        </>
      }
    >
      <form
        id="holding-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        {!editing && (
          <>
            <Field label="Conta de investimento" error={errors.accountId?.message}>
              <Select aria-label="Conta de investimento" {...form.register('accountId')}>
                <option value="">Selecionar conta</option>
                {investmentAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </Field>
            {investmentAccounts.length === 0 && (
              <p className="text-body-sm text-expense">
                Crie primeiro uma conta do tipo Investimento na tela de contas.
              </p>
            )}

            <Field label="Tipo" error={errors.kind?.message}>
              <Select aria-label="Tipo" {...form.register('kind')}>
                {Object.entries(KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

        <Field label="Nome" error={errors.name?.message}>
          <Input placeholder="ex: CDB Inter liquidez diária" {...form.register('name')} />
        </Field>

        {!isTreasury && (
          <Field label="Emissor (opcional)" error={errors.issuer?.message}>
            <Input placeholder="ex: Banco Inter" {...form.register('issuer')} />
          </Field>
        )}

        {isTreasury ? (
          <>
            <Field label="Título" error={errors.treasuryBond?.message}>
              <Select aria-label="Título do Tesouro" {...form.register('treasuryBond')}>
                <option value="">
                  {bondsLoading ? 'Carregando títulos…' : 'Selecionar título'}
                </option>
                {(bonds ?? []).map((bond) => (
                  <option
                    key={treasuryBondValue(bond.bondType, bond.maturityDate)}
                    value={treasuryBondValue(bond.bondType, bond.maturityDate)}
                  >
                    {bond.bondType} · vence {formatLocalDate(bond.maturityDate)} ·{' '}
                    {formatMoney(toNumber(bond.puBase))}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Quantidade de títulos (opcional)"
              hint="Sem ela, é calculada pelo preço de compra do dia da aplicação."
              error={errors.treasuryQuantity?.message}
            >
              <Input
                inputMode="decimal"
                placeholder="ex: 0,35"
                {...form.register('treasuryQuantity')}
              />
            </Field>
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Indexador" error={errors.indexer?.message}>
              <Select aria-label="Indexador" {...form.register('indexer')}>
                {kind === 'OTHER' && <option value="">Sem indexador (valor informado)</option>}
                {Object.entries(INDEXER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            {indexer && (
              <Field label="Taxa (%)" hint={RATE_HINTS[indexer]} error={errors.rate?.message}>
                <Input inputMode="decimal" placeholder="ex: 110" {...form.register('rate')} />
              </Field>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Valor aplicado" error={errors.principal?.message}>
            <MoneyInput
              placeholder="ex: 1.000,00"
              disabled={locked}
              {...form.register('principal')}
            />
          </Field>
          <Field label="Data da aplicação" error={errors.appliedAt?.message}>
            <Input
              type="date"
              max={localIsoDate()}
              disabled={locked}
              {...form.register('appliedAt')}
            />
          </Field>
        </div>

        {!isTreasury && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Liquidez" error={errors.liquidity?.message}>
              <Select aria-label="Liquidez" {...form.register('liquidity')}>
                <option value="DAILY">Diária</option>
                <option value="AT_MATURITY">No vencimento</option>
              </Select>
            </Field>
            <Field label="Vencimento (opcional)" error={errors.maturityDate?.message}>
              <Input type="date" {...form.register('maturityDate')} />
            </Field>
          </div>
        )}

        {kind === 'OTHER' && (
          <label className="flex items-center gap-2 text-body-sm text-fg">
            <input type="checkbox" {...form.register('taxExempt')} />
            Isento de IR (CRI, CRA, debênture incentivada)
          </label>
        )}

        {!editing && !prefill && (
          <fieldset className="col gap-2">
            <legend className="mb-1 text-body-sm font-semibold text-fg">
              De onde veio o dinheiro
            </legend>
            <label className="flex items-center gap-2 text-body-sm text-fg">
              <input type="radio" value="TRANSFER" {...form.register('funding')} />
              Transferir de uma conta agora
            </label>
            <label className="flex items-center gap-2 text-body-sm text-fg">
              <input type="radio" value="EXISTING" {...form.register('funding')} />
              Já está na conta de investimento
            </label>
            {funding === 'TRANSFER' && (
              <Field label="Conta de origem" error={errors.fromAccountId?.message}>
                <Select aria-label="Conta de origem" {...form.register('fromAccountId')}>
                  <option value="">Selecionar conta</option>
                  {otherAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatMoney(account.balance, account.currencyCode)})
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </fieldset>
        )}

        {locked && (
          <p className="text-caption text-fg-muted">Valor e data não mudam depois de um resgate.</p>
        )}

        <Field label="Observações (opcional)" error={errors.notes?.message}>
          <Textarea rows={2} {...form.register('notes')} />
        </Field>
      </form>
    </Modal>
  )
}
