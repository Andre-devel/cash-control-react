import { useQuery } from '@tanstack/react-query'
import { getAccount } from '@/features/accounts/api/accounts.api'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'

export function useAccount(id: string) {
  return useQuery({
    queryKey: [...ACCOUNTS_QUERY_KEY, id],
    queryFn: () => getAccount(id),
    enabled: !!id,
  })
}
