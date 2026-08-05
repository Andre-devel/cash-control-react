import type { Transaction } from '@/features/transactions/types'

/**
 * Uma linha colapsada representa a compra parcelada inteira — os R$ 1.000,00 de
 * "1.000 em 5x" —, não a parcela de R$ 200,00. É o que o backend devolve quando
 * a listagem é pedida com `groupInstallments=true`.
 */
export function isInstallmentGroup(t: Transaction): boolean {
  return t.installmentGroup === true && (t.totalInstallments ?? 0) > 1
}

/** Valor que a linha realmente representa: total da compra quando colapsada. */
export function effectiveAmount(t: Transaction): number {
  if (isInstallmentGroup(t) && t.installmentTotalAmount != null) {
    return parseFloat(t.installmentTotalAmount)
  }
  return parseFloat(t.amount)
}

/** Rótulo do parcelamento: `5x` na linha colapsada, `2/5` numa parcela avulsa. */
export function installmentLabel(t: Transaction): string | null {
  const total = t.totalInstallments ?? 0
  if (total <= 1) return null
  if (isInstallmentGroup(t)) return `${total}x`
  return t.installmentNumber != null ? `${t.installmentNumber}/${total}` : `${total}x`
}
