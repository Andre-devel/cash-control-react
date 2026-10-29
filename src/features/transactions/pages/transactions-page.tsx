import { Fragment, useCallback, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  Plus,
  ScanLine,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/action-menu'
import { Money } from '@/components/ui/money'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import {
  useTransactions,
  useTransactionTotals,
} from '@/features/transactions/hooks/use-transactions'
import { useReactivateTransaction } from '@/features/transactions/hooks/use-reactivate-transaction'
import { usePaymentMethods } from '@/features/transactions/hooks/use-payment-methods'
import {
  parsePeriod,
  periodLabel,
  periodRange,
  serializePeriod,
  type TransactionPeriod,
} from '@/features/transactions/utils/period'
import { localIsoDate, saveBlob, toast } from '@/lib'
import { exportTransactionsCsv } from '@/features/transactions/utils/export-transactions'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import { effectiveAmount } from '@/features/transactions/utils/installment'
import { dayGroupLabel } from '@/features/transactions/utils/transaction-display'
import { TransactionRow } from '@/features/transactions/components/transaction-row'
import { TransactionCard } from '@/features/transactions/components/transaction-card'
import { TransactionTotals } from '@/features/transactions/components/transaction-totals'
import {
  ActiveFilterChips,
  CountPill,
  FiltersButton,
  TransactionFilterFields,
  TransactionPeriodControl,
  TransactionSearchField,
  buildFilterChips,
  type FilterChip,
} from '@/features/transactions/components/transaction-filter-panel'
import { CreateTransactionDialog } from '@/features/transactions/components/create-transaction-dialog'
import { EditTransactionDialog } from '@/features/transactions/components/edit-transaction-dialog'
import { DeleteTransactionDialog } from '@/features/transactions/components/delete-transaction-dialog'
import { CancelTransactionDialog } from '@/features/transactions/components/cancel-transaction-dialog'
import { ImportStatementDialog } from '@/features/transactions/components/import-statement-dialog'
import { ImportReconciliationDialog } from '@/features/transactions/components/import-reconciliation-dialog'
import { ReceiptReviewDialog } from '@/features/transactions/components/receipt-review-dialog'
import { usePayTransaction } from '@/features/transactions/hooks/use-pay-transaction'
import { ROUTES } from '@/app/router/routes'
import { useMediaQuery, MOBILE_QUERY } from '@/hooks/use-media-query'
import type { Transaction, ListTransactionsParams } from '@/features/transactions/types'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_SORT = 'competenceDate,desc'

/**
 * Abaixo de 1024 px a lista é de cards; a partir daí, tabela densa. Abaixo de 1280 px os
 * filtros vão para um sheet/modal; a partir daí ficam num painel lateral fixo. As consultas
 * são `max-width` de propósito: sem `matchMedia` (jsdom) elas dão `false`, a variante desktop.
 */
const CARD_LIST_QUERY = '(max-width: 1023px)'
const COMPACT_FILTERS_QUERY = '(max-width: 1279px)'

function buildParams(
  searchParams: URLSearchParams,
  period: TransactionPeriod,
): ListTransactionsParams {
  const get = (key: string) => searchParams.get(key) ?? undefined
  return {
    accountId: get('accountId'),
    type: get('type') as ListTransactionsParams['type'],
    status: get('status') as ListTransactionsParams['status'],
    categoryId: get('categoryId'),
    paymentMethod: get('paymentMethod') as ListTransactionsParams['paymentMethod'],
    ...periodRange(period),
    paymentDateFrom: get('paymentDateFrom'),
    paymentDateTo: get('paymentDateTo'),
    amountMin: get('amountMin'),
    amountMax: get('amountMax'),
    searchText: get('searchText'),
    includeCancelled: searchParams.get('includeCancelled') === 'true',
    // Um parcelamento é uma compra só: entra na grid por uma linha, com o valor cheio
    // e o número de parcelas, em vez de N linhas repetindo a mesma compra.
    groupInstallments: true,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 0,
    size: DEFAULT_PAGE_SIZE,
    sort: DEFAULT_SORT,
  }
}

/** O período vai à parte (`period`): as datas de competência derivam dele. */
function paramsToSearchParams(
  params: ListTransactionsParams,
  period: string | null,
): Record<string, string> {
  const out: Record<string, string> = {}
  if (period) out.period = period
  if (params.accountId) out.accountId = params.accountId
  if (params.type) out.type = params.type
  if (params.status) out.status = params.status
  if (params.categoryId) out.categoryId = params.categoryId
  if (params.paymentMethod) out.paymentMethod = params.paymentMethod
  if (params.amountMin) out.amountMin = params.amountMin
  if (params.amountMax) out.amountMax = params.amountMax
  if (params.searchText) out.searchText = params.searchText
  if (params.includeCancelled) out.includeCancelled = 'true'
  if (params.page && params.page > 0) out.page = String(params.page)
  return out
}

function groupSums(rows: Transaction[]) {
  const incomeSum = rows
    .filter((t) => (t.type === 'INCOME' || t.type === 'REFUND') && t.status !== 'CANCELLED')
    .reduce((s, t) => s + effectiveAmount(t), 0)
  const expenseSum = rows
    .filter((t) => t.type === 'EXPENSE' && t.status !== 'CANCELLED')
    .reduce((s, t) => s + effectiveAmount(t), 0)
  return { incomeSum, expenseSum }
}

function DayGroupHeader({ date, rows }: { date: string; rows: Transaction[] }) {
  const { incomeSum, expenseSum } = groupSums(rows)
  return (
    <div className="flex items-baseline justify-between gap-3 px-1 pb-2 pt-4 text-overline uppercase text-fg-muted">
      <span>{dayGroupLabel(date)}</span>
      <span className="flex gap-2 normal-case tracking-normal">
        {incomeSum > 0 && (
          <span className="text-income">
            <Money value={incomeSum} signed />
          </span>
        )}
        {expenseSum > 0 && (
          <span>
            <Money value={-expenseSum} signed />
          </span>
        )}
      </span>
    </div>
  )
}

function ListSkeleton({ cards }: { cards: boolean }) {
  const bar = 'rounded-xs bg-surface-3 animate-pulse motion-reduce:animate-none'
  if (cards) {
    return (
      <div
        className="flex flex-col gap-1.5 pt-4"
        aria-busy="true"
        aria-label="Carregando transações"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-3.5 py-3"
          >
            <span className={`size-9 shrink-0 !rounded-md ${bar}`} />
            <span className="flex flex-1 flex-col gap-2">
              <span className={`h-3.5 w-2/3 ${bar}`} />
              <span className={`h-3 w-1/2 ${bar}`} />
              <span className={`h-4 w-16 !rounded-full ${bar}`} />
            </span>
            <span className={`h-4 w-20 ${bar}`} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-surface-1"
      aria-busy="true"
      aria-label="Carregando transações"
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex min-h-[52px] items-center gap-3 border-t border-border px-4 first:border-t-0"
        >
          <span className={`size-6 shrink-0 ${bar}`} />
          <span className="flex flex-[2] flex-col gap-1.5">
            <span className={`h-3.5 w-40 ${bar}`} />
            <span className={`h-3 w-24 ${bar}`} />
          </span>
          <span className={`h-3 flex-1 ${bar}`} />
          <span className={`h-3 flex-1 ${bar}`} />
          <span className={`h-5 w-16 !rounded-full ${bar}`} />
          <span className={`h-3.5 w-20 ${bar}`} />
        </div>
      ))}
    </div>
  )
}

/** Até cinco números de página em volta da atual. */
function pageWindow(current: number, total: number): number[] {
  const size = Math.min(5, total)
  const start = Math.max(0, Math.min(current - 2, total - size))
  return Array.from({ length: size }, (_, i) => start + i)
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalElements: number
  compact: boolean
  onPageChange: (page: number) => void
}

function Pagination({
  currentPage,
  totalPages,
  totalElements,
  compact,
  onPageChange,
}: PaginationProps) {
  const from = currentPage * DEFAULT_PAGE_SIZE + 1
  const to = Math.min((currentPage + 1) * DEFAULT_PAGE_SIZE, totalElements)
  const isFirst = currentPage === 0
  const isLast = currentPage >= totalPages - 1

  if (compact) {
    return (
      <nav aria-label="Paginação" className="flex items-center gap-2 pt-2">
        <Button
          className="min-h-[48px] flex-1"
          disabled={isFirst}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
          leading={<ChevronLeft size={16} aria-hidden="true" />}
        >
          Anterior
        </Button>
        <span className="shrink-0 px-1 text-caption text-fg-muted" aria-current="page">
          {from}–{to} de {totalElements}
        </span>
        <Button
          className="min-h-[48px] flex-1"
          disabled={isLast}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Próxima página"
          trailing={<ChevronRight size={16} aria-hidden="true" />}
        >
          Próxima
        </Button>
      </nav>
    )
  }

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
      <span className="text-body-sm text-fg-muted">
        Mostrando {from}–{to} de {totalElements} transações
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-md hover:bg-surface-2 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
          disabled={isFirst}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        {pageWindow(currentPage, totalPages).map((p) => (
          <button
            key={p}
            type="button"
            aria-label={`Página ${p + 1}`}
            aria-current={p === currentPage ? 'page' : undefined}
            onClick={() => onPageChange(p)}
            className={`h-9 min-w-9 rounded-md px-2 text-body-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info ${
              p === currentPage ? 'bg-fg text-bg' : 'text-fg hover:bg-surface-2'
            }`}
          >
            {p + 1}
          </button>
        ))}
        <button
          type="button"
          className="grid size-9 place-items-center rounded-md hover:bg-surface-2 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
          disabled={isLast}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const rawPeriod = searchParams.get('period')
  const period = parsePeriod(rawPeriod)
  const filters = buildParams(searchParams, period)

  const { data: pageData, isLoading, isError, error, refetch } = useTransactions(filters)
  const { data: totals, isLoading: totalsLoading } = useTransactionTotals(filters)
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { data: paymentMethods = [] } = usePaymentMethods()
  // useCategories devolve uma árvore; quem faz lookup por id precisa da lista
  // achatada, senão nenhuma subcategoria é encontrada.
  const flatCategories = useMemo(() => flattenCategories(categories), [categories])
  const { mutate: payTransaction } = usePayTransaction()
  const { mutate: reactivateTransaction } = useReactivateTransaction()

  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Transaction | null>(null)

  const isMobile = useMediaQuery(MOBILE_QUERY)
  const isCardList = useMediaQuery(CARD_LIST_QUERY)
  const isCompactFilters = useMediaQuery(COMPACT_FILTERS_QUERY)

  const handleFiltersChange = useCallback(
    (newFilters: ListTransactionsParams) => {
      setSearchParams(paramsToSearchParams(newFilters, rawPeriod), { replace: true })
    },
    [rawPeriod, setSearchParams],
  )

  // Atualização funcional: a busca chega 300 ms depois da digitação e não pode desfazer um
  // filtro trocado nesse meio-tempo.
  const handleSearchChange = useCallback(
    (searchText: string | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (searchText) next.set('searchText', searchText)
          else next.delete('searchText')
          next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const handlePeriodChange = useCallback(
    (next: TransactionPeriod) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          params.set('period', serializePeriod(next))
          params.delete('page')
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // Limpar filtros mantém o período: ele é a "página" da lista, não um filtro.
  const handleReset = useCallback(() => {
    setSearchParams(rawPeriod ? { period: rawPeriod } : {}, { replace: true })
  }, [rawPeriod, setSearchParams])

  const handlePageChange = useCallback(
    (page: number) => {
      setSearchParams(paramsToSearchParams({ ...filters, page }, rawPeriod), { replace: true })
    },
    [filters, rawPeriod, setSearchParams],
  )

  const handleToggleIncludeCancelled = useCallback(() => {
    handleFiltersChange({ ...filters, includeCancelled: !filters.includeCancelled })
  }, [filters, handleFiltersChange])

  const handleRemoveChip = useCallback(
    (chip: FilterChip) => handleFiltersChange({ ...filters, ...chip.remove, page: 0 }),
    [filters, handleFiltersChange],
  )

  const handlePay = useCallback((t: Transaction) => payTransaction({ id: t.id }), [payTransaction])
  const handleReactivate = useCallback(
    (t: Transaction) => reactivateTransaction(t.id),
    [reactivateTransaction],
  )
  const handleView = useCallback(
    (t: Transaction) => void navigate(ROUTES.TRANSACTION_DETAIL.replace(':id', t.id)),
    [navigate],
  )
  const [exporting, setExporting] = useState(false)
  const handleExport = useCallback(() => {
    setExporting(true)
    exportTransactionsCsv(filters)
      .then((blob) => saveBlob(blob, `transacoes-${localIsoDate()}.csv`))
      .catch(() => toast.error('Não foi possível exportar as transações.'))
      .finally(() => setExporting(false))
  }, [filters])

  const handleViewSeries = useCallback(() => void navigate(ROUTES.INSTALLMENTS), [navigate])

  function handleReceiptChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    if (file) setReceiptFile(file)
  }

  const transactions = useMemo(() => pageData?.content ?? [], [pageData])
  const totalElements = pageData?.totalElements ?? 0
  const totalPages = pageData?.totalPages ?? 0
  const currentPage = filters.page ?? 0

  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>()
    for (const tx of transactions) {
      const key = tx.competenceDate
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(tx)
    }
    return Array.from(groups.entries())
  }, [transactions])

  const chips = buildFilterChips(filters, accounts, flatCategories, paymentMethods)
  const correlationId = (error as { correlationId?: string } | null)?.correlationId

  const actionHandlers = {
    onEdit: setEditTarget,
    onDelete: setDeleteTarget,
    onPay: handlePay,
    onCancel: setCancelTarget,
    onReactivate: handleReactivate,
    onView: handleView,
    onViewSeries: handleViewSeries,
  }

  const filterFields = (
    <TransactionFilterFields
      filters={filters}
      accounts={accounts}
      categories={flatCategories}
      includeCancelled={filters.includeCancelled ?? false}
      onFiltersChange={handleFiltersChange}
      onToggleIncludeCancelled={handleToggleIncludeCancelled}
    />
  )

  const list = isLoading ? (
    <ListSkeleton cards={isCardList} />
  ) : isError ? (
    <div className="rounded-xl border border-border bg-surface-1 p-5" role="alert">
      <p className="text-body text-expense">Erro ao carregar transações.</p>
      {correlationId && (
        <p className="mt-1 font-mono text-caption text-fg-muted">Código: {correlationId}</p>
      )}
      <Button className="mt-3" onClick={() => void refetch()}>
        Tentar novamente
      </Button>
    </div>
  ) : transactions.length === 0 ? (
    <div className="rounded-xl border border-border bg-surface-1">
      <EmptyState
        icon={ArrowLeftRight}
        title={
          period.kind === 'month'
            ? `Nenhuma transação em ${periodLabel(period)}.`
            : 'Nenhuma transação encontrada.'
        }
        desc={chips.length > 0 ? 'Tente remover algum filtro.' : undefined}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {period.kind === 'month' && (
              <Button onClick={() => handlePeriodChange({ kind: 'all' })}>
                Ver todo o período
              </Button>
            )}
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              Nova transação
            </Button>
          </div>
        }
      />
    </div>
  ) : (
    <>
      {/* Cards abaixo de 1024 px, tabela a partir daí — mesma página de dados. A troca é
          em JS, e não escondendo uma das versões por CSS, para não deixar a mesma lista
          duas vezes no DOM (leitor de tela leria dobrado). */}
      {isCardList ? (
        <div className="flex flex-col">
          {grouped.map(([date, rows]) => (
            <Fragment key={date}>
              <DayGroupHeader date={date} rows={rows} />
              <div className="flex flex-col gap-1.5">
                {rows.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    accounts={accounts}
                    categories={flatCategories}
                    {...actionHandlers}
                  />
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
          <div className="tbl-wrap scroll-x">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="!pl-4">Descrição</th>
                  <th>Categoria</th>
                  <th>Conta</th>
                  <th className="hidden 2xl:table-cell">Forma de pagamento</th>
                  <th>Status</th>
                  <th className="num">Valor</th>
                  <th className="w-8">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    accounts={accounts}
                    categories={flatCategories}
                    {...actionHandlers}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          compact={isMobile}
          onPageChange={handlePageChange}
        />
      )}
    </>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[13rem] flex-1">
          <h1 className="font-display text-h1 font-extrabold">Transações</h1>
          <p className="mt-1 text-body-sm text-fg-muted">
            {totalElements} {totalElements === 1 ? 'transação' : 'transações'} ·{' '}
            {periodLabel(period).toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Tablet (768–1279): ações secundárias no ⋯ para não espremer o título. */}
          {!isMobile && (
            <span className="xl:hidden">
              <ActionMenu
                label="Mais ações de transações"
                items={[
                  ...(totalElements > 0 && !exporting
                    ? [{ label: 'Exportar', onSelect: () => void handleExport() }]
                    : []),
                  { label: 'Corrigir importações', onSelect: () => setReconcileOpen(true) },
                  {
                    label: 'Lançar comprovante',
                    onSelect: () => receiptInputRef.current?.click(),
                  },
                ]}
              />
            </span>
          )}
          <Button
            className={isMobile ? undefined : 'hidden xl:inline-flex'}
            leading={<Download size={16} aria-hidden="true" />}
            disabled={exporting || totalElements === 0}
            loading={exporting}
            aria-label={isMobile ? (exporting ? 'Exportando…' : 'Exportar') : undefined}
            onClick={handleExport}
          >
            {!isMobile && (exporting ? 'Exportando…' : 'Exportar')}
          </Button>
          {!isMobile && (
            <Button
              className="hidden xl:inline-flex"
              leading={<History size={16} aria-hidden="true" />}
              onClick={() => setReconcileOpen(true)}
            >
              Corrigir importações
            </Button>
          )}
          <Button
            leading={<Upload size={16} aria-hidden="true" />}
            aria-label={isMobile ? 'Importar extrato' : undefined}
            onClick={() => setImportOpen(true)}
          >
            {!isMobile && 'Importar extrato'}
          </Button>
          {!isMobile && (
            <Button
              className="hidden xl:inline-flex"
              leading={<ScanLine size={16} aria-hidden="true" />}
              onClick={() => receiptInputRef.current?.click()}
            >
              Lançar comprovante
            </Button>
          )}
          {/* No celular "Nova transação" fica no FAB da barra inferior. */}
          {!isMobile && (
            <Button
              variant="primary"
              leading={<Plus size={16} aria-hidden="true" />}
              onClick={() => setCreateOpen(true)}
            >
              Nova transação
            </Button>
          )}
        </div>
      </div>

      <input
        ref={receiptInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleReceiptChange}
      />

      <div
        className={
          isCompactFilters
            ? 'flex flex-col gap-4'
            : '[display:grid] grid-cols-[256px_minmax(0,1fr)] items-start gap-5'
        }
      >
        {!isCompactFilters && (
          <aside
            aria-label="Filtros"
            className="sticky top-4 flex flex-col gap-4 rounded-xl border border-border bg-surface-1 p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-[16px] font-bold">
                Filtros
                {chips.length > 0 && <CountPill count={chips.length} />}
              </h2>
              <Button type="button" size="sm" variant="ghost" onClick={handleReset}>
                Limpar filtros
              </Button>
            </div>
            {filterFields}
          </aside>
        )}

        <div className="flex min-w-0 flex-col gap-3.5">
          <div
            role="search"
            aria-label="Filtrar transações"
            className="order-1 flex flex-col gap-3 md:order-2"
          >
            <TransactionPeriodControl period={period} onPeriodChange={handlePeriodChange} />
            <div className="flex items-center gap-2">
              <TransactionSearchField
                searchText={filters.searchText}
                onSearchChange={handleSearchChange}
              />
              {isCompactFilters && (
                <FiltersButton count={chips.length} onClick={() => setFiltersOpen(true)} />
              )}
            </div>
            <ActiveFilterChips chips={chips} onRemove={handleRemoveChip} scroll={isMobile} />
          </div>

          <div className="order-2 md:order-1">
            <TransactionTotals
              totals={totals}
              loading={totalsLoading}
              periodText={periodLabel(period).toLowerCase()}
            />
          </div>

          <div className="order-3 flex flex-col gap-3">{list}</div>
        </div>
      </div>

      {isCompactFilters && filtersOpen && (
        <Modal
          title="Filtros"
          subtitle={chips.length > 0 ? `${chips.length} ativos` : undefined}
          onClose={() => setFiltersOpen(false)}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={handleReset}>
                Limpar filtros
              </Button>
              <div className="spacer" />
              <Button type="button" variant="primary" onClick={() => setFiltersOpen(false)}>
                {isLoading
                  ? 'Ver resultados'
                  : `Ver ${totalElements} ${totalElements === 1 ? 'resultado' : 'resultados'}`}
              </Button>
            </>
          }
        >
          {filterFields}
        </Modal>
      )}

      <CreateTransactionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <ImportStatementDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onReconcile={() => {
          setImportOpen(false)
          setReconcileOpen(true)
        }}
      />
      <ImportReconciliationDialog open={reconcileOpen} onClose={() => setReconcileOpen(false)} />
      {receiptFile && (
        <ReceiptReviewDialog open file={receiptFile} onClose={() => setReceiptFile(null)} />
      )}

      <EditTransactionDialog
        transaction={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
      />

      <DeleteTransactionDialog
        transaction={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      />

      <CancelTransactionDialog
        transaction={cancelTarget}
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  )
}
