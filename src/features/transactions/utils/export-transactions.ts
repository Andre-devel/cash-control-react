import { listTransactions } from '@/features/transactions/api/transactions.api'
import type { ScopeFilter } from '@/app/store/scope.store'
import { TRANSACTION_STATUS_LABELS } from '@/features/transactions/utils/transaction-status'
import {
  TRANSACTION_TYPE_DISPLAY,
  isPositiveTransaction,
} from '@/features/transactions/utils/transaction-type'
import type { ListTransactionsParams, Transaction } from '@/features/transactions/types'
import { buildCsvBlob, csvMoney } from '@/lib/csv'

const EXPORT_PAGE_SIZE = 500

/** Busca todas as páginas que casam com os filtros, uma parcela por linha. */
async function fetchAllTransactions(
  filters: ListTransactionsParams,
  scope: ScopeFilter,
): Promise<Transaction[]> {
  const rows: Transaction[] = []
  for (let page = 0; ; page++) {
    const result = await listTransactions(
      {
        ...filters,
        groupInstallments: false,
        page,
        size: EXPORT_PAGE_SIZE,
      },
      scope,
    )
    rows.push(...result.content)
    if (page + 1 >= result.totalPages) return rows
  }
}

/** `aaaa-mm-dd` da API para `dd/mm/aaaa`, sem passar por `Date` (fuso). */
function csvDate(iso: string | null): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

/** `scope` é o filtro PF / PJ da tela: o CSV traz o mesmo que a lista mostra. */
export async function exportTransactionsCsv(
  filters: ListTransactionsParams,
  scope: ScopeFilter = 'ALL',
): Promise<Blob> {
  const transactions = await fetchAllTransactions(filters, scope)
  const header = [
    'Data',
    'Data do pagamento',
    'Descrição',
    'Tipo',
    'Status',
    'Categoria',
    'Conta',
    'Cartão',
    'Forma de pagamento',
    'Parcela',
    'Valor (R$)',
  ]
  const rows = transactions.map((t) => {
    const amount = parseFloat(t.amount)
    const signed = isPositiveTransaction(t.type, amount) ? Math.abs(amount) : -Math.abs(amount)
    return [
      csvDate(t.competenceDate),
      csvDate(t.paymentDate),
      t.description,
      TRANSACTION_TYPE_DISPLAY[t.type].label,
      TRANSACTION_STATUS_LABELS[t.status],
      t.categoryName ?? '',
      t.accountName ?? '',
      t.creditCard?.name ?? '',
      t.paymentMethod?.name ?? '',
      t.installmentNumber && t.totalInstallments
        ? `${t.installmentNumber}/${t.totalInstallments}`
        : '',
      csvMoney(signed),
    ]
  })
  return buildCsvBlob([header, ...rows])
}
