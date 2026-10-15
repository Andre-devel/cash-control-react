import type { Transaction, TransactionStatus } from '@/features/transactions/types'

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: 'Pendente',
  OVERDUE: 'Vencida',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
}

/** Espelha `TransactionServiceImpl.markAsPaid`: só PENDENTE e VENCIDA aceitam pagamento. */
export function isPayableStatus(status: TransactionStatus): boolean {
  return status === 'PENDING' || status === 'OVERDUE'
}

/**
 * Se a transação pode ser paga individualmente. Compra no cartão não pode: ela é quitada
 * pelo pagamento da fatura, e o backend recusa o pagamento avulso.
 */
export function canPayTransaction(
  transaction: Pick<Transaction, 'status' | 'paymentMethod'>,
): boolean {
  return isPayableStatus(transaction.status) && transaction.paymentMethod?.slug !== 'CREDIT_CARD'
}

/**
 * Pagamento de fatura não aceita edição, cancelamento nem exclusão: ele é o dinheiro que
 * quitou a fatura e as compras dela.
 */
export function isLockedTransaction(transaction: Pick<Transaction, 'type'>): boolean {
  return transaction.type === 'INVOICE_PAYMENT'
}
