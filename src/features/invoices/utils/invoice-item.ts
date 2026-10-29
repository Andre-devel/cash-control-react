import type { InvoiceItem } from '@/features/invoices/types'

/** A parcela como `n/m`, ou `null` quando o item não é parcelado. */
export function installmentLabel(
  item: Pick<InvoiceItem, 'installmentNumber' | 'totalInstallments'>,
): string | null {
  return item.installmentNumber && item.totalInstallments
    ? `${item.installmentNumber}/${item.totalInstallments}`
    : null
}

/** A descrição original só aparece quando difere da atual — senão seria a mesma linha duas vezes. */
export function originalDescriptionOf(item: InvoiceItem): string | null {
  return item.originalDescription && item.originalDescription !== item.description
    ? item.originalDescription
    : null
}
