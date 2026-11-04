import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteBankOrphanItem,
  getBankOrphanItems,
  getBankSyncOverview,
  getBankSyncRuns,
} from '@/features/bank-sync/api/bank-sync.api'
import { toast } from '@/lib/toast'
import type { BankSyncRunParams } from '@/features/bank-sync/types'
import type { NormalizedError } from '@/features/auth/types'

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

const ORPHANS_QUERY_KEY = [...BANK_SYNC_QUERY_KEY, 'orphans'] as const

export function useBankOrphanItems() {
  return useQuery({
    queryKey: ORPHANS_QUERY_KEY,
    queryFn: getBankOrphanItems,
    staleTime: 30_000,
  })
}

// Apagar o item na Pluggy não move dinheiro: nenhum lançamento veio dele.
export function useDeleteBankOrphanItem() {
  const queryClient = useQueryClient()
  return useMutation<void, NormalizedError, string>({
    mutationFn: deleteBankOrphanItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORPHANS_QUERY_KEY })
      toast.success('Item apagado na Pluggy.')
    },
    onError: (error) =>
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined),
  })
}
