import { useQuery } from '@tanstack/react-query'
import { getTransaction } from '@/features/transactions/api/transactions.api'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, id],
    queryFn: () => getTransaction(id!),
    enabled: Boolean(id),
  })
}
