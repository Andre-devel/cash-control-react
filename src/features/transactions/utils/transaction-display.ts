import type { Transaction } from '@/features/transactions/types'
import type { Account } from '@/features/accounts/types'
import type { Category } from '@/features/categories/types'
import {
  TRANSACTION_TYPE_DISPLAY,
  isPositiveTransaction,
  transactionTypeColor,
} from '@/features/transactions/utils/transaction-type'
import {
  effectiveAmount,
  installmentLabel,
  isInstallmentGroup,
} from '@/features/transactions/utils/installment'
import { localIsoDate } from '@/lib/local-date'
import { categoryColorCss } from '@/features/categories/utils/category-colors'

export const MONTH_ABBR_PT = [
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

function parts(iso: string) {
  const [y, m, d] = iso.split('-')
  return {
    year: y ?? '',
    month: parseInt(m ?? '1', 10) - 1,
    day: parseInt(d ?? '1', 10),
  }
}

/** `28 out` */
export function fmtDateShort(iso: string): string {
  const { month, day } = parts(iso)
  return `${String(day).padStart(2, '0')} ${MONTH_ABBR_PT[month] ?? ''}`
}

/** `28 out 2026` */
export function fmtDateMedium(iso: string): string {
  const { year } = parts(iso)
  return `${fmtDateShort(iso)} ${year}`
}

/** `28 de out de 2026` */
export function fmtDateFull(iso: string): string {
  const { year, month, day } = parts(iso)
  return `${String(day).padStart(2, '0')} de ${MONTH_ABBR_PT[month] ?? ''} de ${year}`
}

/** Rótulo do grupo do dia: "Hoje · 28 out", "Ontem · 27 out" ou "25 out 2026". */
export function dayGroupLabel(iso: string, today = localIsoDate()): string {
  if (iso === today) return `Hoje · ${fmtDateShort(iso)}`
  const t = new Date(`${today}T12:00:00`)
  t.setDate(t.getDate() - 1)
  const yesterday = localIsoDate(t)
  if (iso === yesterday) return `Ontem · ${fmtDateShort(iso)}`
  return fmtDateMedium(iso)
}

/** Tudo que a linha e o card exibem de uma transação, resolvido num lugar só. */
export function describeTransaction(
  transaction: Transaction,
  accounts: Account[],
  categories: Category[],
) {
  const category = transaction.categoryId
    ? (categories.find((c) => c.id === transaction.categoryId) ?? null)
    : null
  const account = accounts.find((a) => a.id === transaction.accountId) ?? null
  const amount = effectiveAmount(transaction)
  const isPositive = isPositiveTransaction(transaction.type, amount)
  const display = TRANSACTION_TYPE_DISPLAY[transaction.type]
  const isSeries = isInstallmentGroup(transaction)
  const installments = installmentLabel(transaction)
  return {
    category,
    account,
    /** Valor com sinal de exibição: positivo entra, negativo sai. */
    signedAmount: isPositive ? Math.abs(amount) : -Math.abs(amount),
    isPositive,
    isCancelled: transaction.status === 'CANCELLED',
    typeLabel: display.label,
    icon: display.icon,
    bubbleColor: category?.color
      ? categoryColorCss(category.color)
      : transactionTypeColor(transaction.type, amount),
    isSeries,
    installments,
    installmentsTitle: installments
      ? isSeries
        ? `Compra parcelada em ${transaction.totalInstallments}x` +
          (transaction.paidInstallments != null
            ? ` · ${transaction.paidInstallments} de ${transaction.totalInstallments} pagas`
            : '')
        : `Parcela ${transaction.installmentNumber} de ${transaction.totalInstallments}`
      : undefined,
    accountLabel: account?.name ?? transaction.accountName ?? null,
  }
}
