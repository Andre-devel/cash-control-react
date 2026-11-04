import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getBankSyncOverview, getBankSyncRuns } from '@/features/bank-sync/api/bank-sync.api'
import type { BankSyncRunParams } from '@/features/bank-sync/types'

export const BANK_SYNC_QUERY_KEY = ['bank-sync'] as const

export function useBankSyncOverview() {
  return useQuery({
    queryKey: [...BANK_SYNC_QUERY_KEY, 'overview'],
    queryFn: getBankSyncOverview,
    staleTime: 30_000,
  })
}

export function useBankSyncRuns(params: BankSyncRunParams) {
  return useQuery({
    queryKey: [...BANK_SYNC_QUERY_KEY, 'runs', params],
    queryFn: () => getBankSyncRuns(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}
