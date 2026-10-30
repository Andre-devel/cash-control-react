import { useState } from 'react'
import { PiggyBank, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Money } from '@/components/ui/money'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import {
  Panel,
  PanelHeader,
  SkeletonBlock,
  WidgetError,
} from '@/features/dashboard/components/panel'
import { AllocationCard } from '@/features/investments/components/allocation-card'
import { DeleteHoldingDialog } from '@/features/investments/components/delete-holding-dialog'
import { HoldingDetailDialog } from '@/features/investments/components/holding-detail-dialog'
import { HoldingFormDialog } from '@/features/investments/components/holding-form-dialog'
import { HoldingsList } from '@/features/investments/components/holdings-list'
import { ManualValueDialog } from '@/features/investments/components/manual-value-dialog'
import { MarketStatus } from '@/features/investments/components/market-status'
import { RedeemDialog } from '@/features/investments/components/redeem-dialog'
import { Segmented } from '@/features/investments/components/segmented'
import { SummaryCards } from '@/features/investments/components/summary-cards'
import {
  useHoldings,
  useInvestmentSummary,
  useMarketIndexes,
} from '@/features/investments/hooks/use-investments'
import type { FixedIncomeHolding, FixedIncomeStatus } from '@/features/investments/types'
import { toNumber } from '@/features/investments/utils/labels'
import { formatLocalDate } from '@/lib/format-date'

const STATUS_OPTIONS: { id: FixedIncomeStatus; label: string }[] = [
  { id: 'ACTIVE', label: 'Ativas' },
  { id: 'REDEEMED', label: 'Resgatadas' },
]

export default function InvestmentsPage() {
  const [status, setStatus] = useState<FixedIncomeStatus>('ACTIVE')
  const summary = useInvestmentSummary()
  const holdings = useHoldings(status)
  const { data: indexes } = useMarketIndexes()
  const { data: accounts = [] } = useAccounts()

  const [formOpen, setFormOpen] = useState(false)
  const [prefill, setPrefill] = useState<{ accountId: string; principal: number } | null>(null)
  const [editTarget, setEditTarget] = useState<FixedIncomeHolding | null>(null)
  const [detailTarget, setDetailTarget] = useState<FixedIncomeHolding | null>(null)
  const [redeemTarget, setRedeemTarget] = useState<FixedIncomeHolding | null>(null)
  const [manualTarget, setManualTarget] = useState<FixedIncomeHolding | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FixedIncomeHolding | null>(null)

  function openCreate(fill: { accountId: string; principal: number } | null = null) {
    setPrefill(fill)
    setEditTarget(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditTarget(null)
    setPrefill(null)
  }

  const data = summary.data
  const activeCount = data ? data.byKind.length : 0
  const hasHoldings = (holdings.data?.length ?? 0) > 0
  const unallocated = (data?.accounts ?? []).filter(
    (a) => Math.abs(toNumber(a.unallocated)) >= 0.01,
  )

  return (
    <div>
      <div className="page-h">
        <div>
          <h1 className="title">Investimentos</h1>
          <div className="desc">
            <MarketStatus indexes={indexes} />
          </div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <Button
            variant="primary"
            leading={<Plus size={16} aria-hidden="true" />}
            onClick={() => openCreate()}
            aria-label="Nova aplicação"
            className="min-w-touch"
          >
            <span className="hidden md:inline">Nova aplicação</span>
          </Button>
        </div>
      </div>

      <div className="col gap-4 lg:gap-5">
        {summary.isLoading ? (
          <div
            className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4"
            aria-busy="true"
            aria-label="Carregando resumo"
          >
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBlock key={i} className="h-[92px] rounded-2xl" />
            ))}
          </div>
        ) : summary.isError ? (
          <WidgetError
            message="Erro ao carregar o resumo."
            onRetry={() => void summary.refetch()}
          />
        ) : (
          data && toNumber(data.totalPrincipal) > 0 && <SummaryCards summary={data} />
        )}

        {unallocated.map((account) => {
          const value = toNumber(account.unallocated)
          return value > 0 ? (
            <div
              key={account.accountId}
              role="status"
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3 text-body-sm"
            >
              <span className="min-w-0 flex-1 text-fg">
                <Money value={value} /> em <strong>{account.accountName}</strong> sem aplicação
                registrada.
              </span>
              <Button
                size="sm"
                onClick={() => openCreate({ accountId: account.accountId, principal: value })}
              >
                Registrar aplicação
              </Button>
            </div>
          ) : (
            <div
              key={account.accountId}
              role="status"
              className="rounded-xl border border-border bg-surface-1 px-4 py-3 text-body-sm text-fg"
            >
              As aplicações de <strong>{account.accountName}</strong> somam <Money value={-value} />{' '}
              a mais que o saldo da conta. Algum resgate entrou pelo extrato sem ser registrado
              aqui: use “Resgatar” na aplicação correspondente.
            </div>
          )
        })}

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-5">
          <Panel label="Aplicações" className="order-2 lg:order-1">
            <PanelHeader
              title="Aplicações"
              right={
                <Segmented
                  label="Situação das aplicações"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={setStatus}
                />
              }
            />
            {holdings.isLoading ? (
              <div aria-busy="true" aria-label="Carregando aplicações" className="col gap-2">
                <SkeletonBlock className="h-14" />
                <SkeletonBlock className="h-14" />
              </div>
            ) : holdings.isError ? (
              <WidgetError
                message="Erro ao carregar as aplicações."
                onRetry={() => void holdings.refetch()}
              />
            ) : hasHoldings ? (
              <HoldingsList
                holdings={holdings.data ?? []}
                onOpen={setDetailTarget}
                onRedeem={setRedeemTarget}
                onEdit={(holding) => {
                  setEditTarget(holding)
                  setFormOpen(true)
                }}
                onManualValue={setManualTarget}
                onDelete={setDeleteTarget}
              />
            ) : status === 'ACTIVE' ? (
              <EmptyState
                icon={PiggyBank}
                title="Nenhuma aplicação ativa"
                desc="Registre seus CDBs, LCIs, LCAs e títulos do Tesouro para acompanhar o rendimento."
                action={
                  <Button variant="primary" onClick={() => openCreate()}>
                    Nova aplicação
                  </Button>
                }
              />
            ) : (
              <p className="py-8 text-center text-body-sm text-fg-muted">
                Nenhuma aplicação resgatada.
              </p>
            )}
          </Panel>

          <div className="order-1 col gap-4 lg:order-2 lg:gap-5">
            {data && activeCount > 0 && <AllocationCard summary={data} />}
            {data && data.upcomingMaturities.length > 0 && (
              <Panel label="Próximos vencimentos">
                <PanelHeader title="Próximos vencimentos" sub="Nos próximos 90 dias" />
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {data.upcomingMaturities.map((maturity) => (
                    <li key={maturity.holdingId} className="flex items-center gap-3 text-body-sm">
                      <span className="w-20 shrink-0 tabular-nums text-fg-muted">
                        {formatLocalDate(maturity.maturityDate)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-fg">{maturity.name}</span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        <Money value={toNumber(maturity.net)} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        </div>
      </div>

      <HoldingFormDialog
        open={formOpen}
        onClose={closeForm}
        accounts={accounts}
        holding={editTarget}
        prefill={prefill}
      />
      <HoldingDetailDialog holding={detailTarget} onClose={() => setDetailTarget(null)} />
      <RedeemDialog
        holding={redeemTarget}
        accounts={accounts}
        onClose={() => setRedeemTarget(null)}
      />
      <ManualValueDialog holding={manualTarget} onClose={() => setManualTarget(null)} />
      <DeleteHoldingDialog holding={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  )
}
