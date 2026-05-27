import { Button } from '@/components/ui/button'
import { usePayTransaction } from '@/features/transactions/hooks/use-pay-transaction'
import type { Transaction } from '@/features/transactions/types'

interface PayTransactionButtonProps {
  transaction: Transaction
}

export function PayTransactionButton({ transaction }: PayTransactionButtonProps) {
  const { mutate: payTransaction, isPending } = usePayTransaction()

  if (transaction.status !== 'PENDING') return null

  return (
    <Button
      size="sm"
      variant="outline"
      className="min-h-[44px]"
      disabled={isPending}
      aria-busy={isPending}
      onClick={() => payTransaction(transaction.id)}
    >
      {isPending ? (
        <>
          <span
            className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          Paying…
        </>
      ) : (
        'Mark as Paid'
      )}
    </Button>
  )
}
