import { Fragment, useCallback, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Download,
  Upload,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { useTransactions } from '@/features/transactions/hooks/use-transactions'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { TransactionRow } from '@/features/transactions/components/transaction-row'
import { TransactionFilterPanel } from '@/features/transactions/components/transaction-filter-panel'
import { CreateTransactionDialog } from '@/features/transactions/components/create-transaction-dialog'
import { EditTransactionDialog } from '@/features/transactions/components/edit-transaction-dialog'
import { DeleteTransactionDialog } from '@/features/transactions/components/delete-transaction-dialog'
import { CancelTransactionDialog } from '@/features/transactions/components/cancel-transaction-dialog'
import { usePayTransaction } from '@/features/transactions/hooks/use-pay-transaction'
import { ROUTES } from '@/app/router/routes'
import type { Transaction, ListTransactionsParams } from '@/features/transactions/types'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_SORT = 'competenceDate,desc'

const MONTH_NAMES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const MONTH_ABBR_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

function fmtDateFull(iso: string): string {
  const parts = iso.split('-')
  const day = parseInt(parts[2] ?? '1', 10)
  const month = parseInt(parts[1] ?? '1', 10) - 1
  const year = parts[0]
  return `${String(day).padStart(2, '0')} de ${MONTH_ABBR_PT[month] ?? ''} de ${year}`
}

function buildParams(searchParams: URLSearchParams): ListTransactionsParams {
  const get = (key: string) => searchParams.get(key) ?? undefined
  return {
    accountId: get('accountId'),
    type: get('type') as ListTransactionsParams['type'],
    status: get('status') as ListTransactionsParams['status'],
    categoryId: get('categoryId'),
    competenceDateFrom: get('competenceDateFrom'),
    competenceDateTo: get('competenceDateTo'),
    paymentDateFrom: get('paymentDateFrom'),
    paymentDateTo: get('paymentDateTo'),
    amountMin: get('amountMin'),
    amountMax: get('amountMax'),
    searchText: get('searchText'),
    includeCancelled: searchParams.get('includeCancelled') === 'true',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 0,
    size: DEFAULT_PAGE_SIZE,
    sort: DEFAULT_SORT,
  }
}

function paramsToSearchParams(params: ListTransactionsParams): Record<string, string> {
  const out: Record<string, string> = {}
  if (params.accountId) out.accountId = params.accountId
  if (params.type) out.type = params.type
  if (params.status) out.status = params.status
  if (params.categoryId) out.categoryId = params.categoryId
  if (params.competenceDateFrom) out.competenceDateFrom = params.competenceDateFrom
  if (params.competenceDateTo) out.competenceDateTo = params.competenceDateTo
  if (params.amountMin) out.amountMin = params.amountMin
  if (params.amountMax) out.amountMax = params.amountMax
  if (params.searchText) out.searchText = params.searchText
  if (params.includeCancelled) out.includeCancelled = 'true'
  if (params.page && params.page > 0) out.page = String(params.page)
  return out
}

interface GroupDateRowProps {
  date: string
  rows: Transaction[]
}

function GroupDateRow({ date, rows }: GroupDateRowProps) {
  const incomeSum = rows
    .filter((t) => (t.type === 'INCOME' || t.type === 'REFUND') && t.status !== 'CANCELLED')
    .reduce((s, t) => s + parseFloat(t.amount), 0)
  const expenseSum = rows
    .filter((t) => t.type === 'EXPENSE' && t.status !== 'CANCELLED')
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  return (
    <tr style={{ background: 'var(--surface-2)' }}>
      <td
        colSpan={10}
        style={{
          padding: '8px 16px',
          color: 'var(--text-dim)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ marginRight: 12 }}>{fmtDateFull(date)}</span>
        {incomeSum > 0 && (
          <span className="mono" style={{ color: 'var(--income)' }}>
            <Money value={incomeSum} signed />
          </span>
        )}
        {incomeSum > 0 && expenseSum > 0 && (
          <span style={{ margin: '0 8px', color: 'var(--text-faint)' }}>·</span>
        )}
        {expenseSum > 0 && (
          <span className="mono" style={{ color: 'var(--expense)' }}>
            <Money value={-expenseSum} signed />
          </span>
        )}
      </td>
    </tr>
  )
}

interface SummaryKpiProps {
  kind: 'income' | 'expense' | 'net'
  label: string
  value: number
  count: number
}

function SummaryKpi({ kind, label, value, count }: SummaryKpiProps) {
  const color =
    kind === 'income' ? 'var(--income)' : kind === 'expense' ? 'var(--expense)' : 'var(--text)'
  const IconCmp = kind === 'income' ? ArrowDownLeft : kind === 'expense' ? ArrowUpRight : BarChart2

  return (
    <div className="kpi">
      <div className="label" style={{ color }}>
        <IconCmp size={13} /> {label}
      </div>
      <div className="value" style={{ color, fontSize: 22 }}>
        <Money value={kind === 'net' ? value : Math.abs(value)} signed={kind === 'net'} />
      </div>
      <div className="delta">{count} transações</div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="card flush animate-pulse" aria-busy="true" aria-label="Carregando transações">
      <table className="tbl">
        <tbody>
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 16, width: 32 }}>
                <div
                  style={{ width: 14, height: 14, background: 'var(--surface-3)', borderRadius: 3 }}
                />
              </td>
              <td style={{ minWidth: 200 }}>
                <div
                  style={{
                    height: 12,
                    width: 160,
                    background: 'var(--surface-3)',
                    borderRadius: 4,
                  }}
                />
              </td>
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <td key={j}>
                  <div
                    style={{
                      height: 12,
                      width: 70,
                      background: 'var(--surface-3)',
                      borderRadius: 4,
                    }}
                  />
                </td>
              ))}
              <td style={{ paddingRight: 8 }} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const filters = buildParams(searchParams)

  const { data: pageData, isLoading, isError, refetch } = useTransactions(filters)
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const { mutate: payTransaction } = usePayTransaction()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Transaction | null>(null)

  const handleFiltersChange = useCallback(
    (newFilters: ListTransactionsParams) => {
      setSearchParams(paramsToSearchParams(newFilters), { replace: true })
    },
    [setSearchParams],
  )

  const handleReset = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const handlePageChange = useCallback(
    (page: number) => {
      setSearchParams(paramsToSearchParams({ ...filters, page }), { replace: true })
    },
    [filters, setSearchParams],
  )

  const handleToggleIncludeCancelled = useCallback(() => {
    handleFiltersChange({ ...filters, includeCancelled: !filters.includeCancelled })
  }, [filters, handleFiltersChange])

  const handlePay = useCallback((t: Transaction) => payTransaction(t.id), [payTransaction])
  const handleView = useCallback(
    (t: Transaction) => void navigate(ROUTES.TRANSACTION_DETAIL.replace(':id', t.id)),
    [navigate],
  )

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

  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => (t.type === 'INCOME' || t.type === 'REFUND') && t.status === 'PAID')
      .reduce((s, t) => s + parseFloat(t.amount), 0)
    const expense = transactions
      .filter((t) => t.type === 'EXPENSE' && t.status === 'PAID')
      .reduce((s, t) => s + parseFloat(t.amount), 0)
    const incomeCount = transactions.filter(
      (t) => (t.type === 'INCOME' || t.type === 'REFUND') && t.status === 'PAID',
    ).length
    const expenseCount = transactions.filter(
      (t) => t.type === 'EXPENSE' && t.status === 'PAID',
    ).length
    return { income, expense, net: income - expense, incomeCount, expenseCount }
  }, [transactions])

  const now = new Date()
  const monthLabel = `${MONTH_NAMES_PT[now.getMonth()]} ${now.getFullYear()}`

  return (
    <div>
      {/* Page header */}
      <div className="page-h">
        <div>
          <h1>Transações</h1>
          <div className="desc">
            {totalElements} transações · {monthLabel}
          </div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <Button leading={<Download size={14} />}>Exportar</Button>
          <Button leading={<Upload size={14} />}>Importar</Button>
          <Button
            variant="primary"
            leading={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            Nova transação
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-3 mb-4">
        <SummaryKpi
          kind="income"
          label="Receitas (período)"
          value={summary.income}
          count={summary.incomeCount}
        />
        <SummaryKpi
          kind="expense"
          label="Despesas (período)"
          value={summary.expense}
          count={summary.expenseCount}
        />
        <SummaryKpi
          kind="net"
          label="Resultado líquido"
          value={summary.net}
          count={totalElements}
        />
      </div>

      {/* Filter bar */}
      <TransactionFilterPanel
        filters={filters}
        accounts={accounts}
        categories={categories}
        includeCancelled={filters.includeCancelled ?? false}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
        onToggleIncludeCancelled={handleToggleIncludeCancelled}
      />

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <div className="card" role="alert">
          <div className="card-b">
            <p style={{ color: 'var(--expense)', fontSize: 13 }}>Erro ao carregar transações.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              style={{
                color: 'var(--accent)',
                textDecoration: 'underline',
                background: 'none',
                border: 0,
                cursor: 'pointer',
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: 'center', padding: 48, color: 'var(--text-dim)' }}
        >
          <p style={{ fontSize: 14, marginBottom: 16 }}>Nenhuma transação encontrada.</p>
          <Button onClick={() => setCreateOpen(true)}>Criar sua primeira transação</Button>
        </div>
      ) : (
        <>
          <div className="card flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 16, width: 32 }}>
                    <input type="checkbox" className="checkbox" />
                  </th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Conta</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Competência</th>
                  <th>Pagamento</th>
                  <th className="num">Valor</th>
                  <th style={{ width: 32 }} />
                </tr>
              </thead>
              <tbody>
                {grouped.map(([date, rows]) => (
                  <Fragment key={date}>
                    <GroupDateRow date={date} rows={rows} />
                    {rows.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        accounts={accounts}
                        categories={categories}
                        onEdit={setEditTarget}
                        onDelete={setDeleteTarget}
                        onPay={handlePay}
                        onCancel={setCancelTarget}
                        onView={handleView}
                      />
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="row between mt-4">
              <div className="text-xs text-dim">
                Mostrando {currentPage * DEFAULT_PAGE_SIZE + 1}–
                {Math.min((currentPage + 1) * DEFAULT_PAGE_SIZE, totalElements)} de {totalElements}{' '}
                transações
              </div>
              <div className="row gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={currentPage === 0}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button size="sm">{currentPage + 1}</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Próxima página"
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateTransactionDialog open={createOpen} onClose={() => setCreateOpen(false)} />

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
