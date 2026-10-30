import { useQuery } from '@tanstack/react-query'
import { listBankConnections } from '@/features/bank-connections/api/bank-connections.api'

export const BANK_CONNECTIONS_QUERY_KEY = ['bank-connections'] as const

export function useBankConnections() {
  return useQuery({
    queryKey: BANK_CONNECTIONS_QUERY_KEY,
    queryFn: listBankConnections,
  })
}
