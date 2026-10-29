import { CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePayTransaction } from '@/features/transactions/hooks/use-pay-transaction'
import type { Transaction } from '@/features/transactions/types'
import { canPayTransaction } from '@/features/transactions/utils/transaction-status'

interface PayTransactionButtonProps {
  transaction: Transaction
  className?: string
}

export function PayTransactionButton({ transaction, className = '' }: PayTransactionButtonProps) {
  const { mutate: payTransaction, isPending } = usePayTransaction()

  if (!canPayTransaction(transaction)) return null

  return (
    <Button
      variant="primary"
      className={`min-h-touch ${className}`}
      loading={isPending}
      leading={<CircleCheck size={16} aria-hidden="true" />}
      onClick={() => payTransaction({ id: transaction.id })}
    >
      {isPending ? 'Pagando…' : 'Marcar como paga'}
    </Button>
  )
}
