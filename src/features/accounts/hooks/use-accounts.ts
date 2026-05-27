import { useQuery } from '@tanstack/react-query'
import { listAccounts } from '@/features/accounts/api/accounts.api'
import type { ListAccountsParams } from '@/features/accounts/types'

export const ACCOUNTS_QUERY_KEY = ['accounts'] as const

export function useAccounts(params?: ListAccountsParams) {
  return useQuery({
    queryKey: [...ACCOUNTS_QUERY_KEY, params],
    queryFn: () => listAccounts(params),
  })
}
