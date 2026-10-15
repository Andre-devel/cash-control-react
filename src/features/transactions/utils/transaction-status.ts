import type { TransactionStatus } from '@/features/transactions/types'

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
