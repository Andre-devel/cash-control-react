import { useQuery } from '@tanstack/react-query'
import {
  getHoldingEvolution,
  getInvestmentSummary,
  getMarketIndexes,
  listHoldings,
  listPendingTransfers,
  listTreasuryBonds,
  previewRedemption,
} from '@/features/investments/api/investments.api'
import type { FixedIncomeStatus, RedemptionPreviewParams } from '@/features/investments/types'

/** Raiz de todas as consultas de investimentos; as mutações invalidam por aqui. */
export const INVESTMENTS_QUERY_KEY = ['investments'] as const

export function useInvestmentSummary() {
  return useQuery({
    queryKey: [...INVESTMENTS_QUERY_KEY, 'summary'],
    queryFn: getInvestmentSummary,
  })
}

export function useMarketIndexes() {
  return useQuery({
    queryKey: [...INVESTMENTS_QUERY_KEY, 'indexes'],
    queryFn: getMarketIndexes,
    staleTime: 10 * 60 * 1000,
  })
}

export function useTreasuryBonds(enabled: boolean) {
  return useQuery({
    queryKey: [...INVESTMENTS_QUERY_KEY, 'treasury-bonds'],
    queryFn: listTreasuryBonds,
    enabled,
    staleTime: 60 * 60 * 1000,
  })
}

export function usePendingTransfers() {
  return useQuery({
    queryKey: [...INVESTMENTS_QUERY_KEY, 'pending-transfers'],
    queryFn: listPendingTransfers,
  })
}

export function useHoldings(status?: FixedIncomeStatus) {
  return useQuery({
    queryKey: [...INVESTMENTS_QUERY_KEY, 'holdings', status ?? 'ALL'],
    queryFn: () => listHoldings(status),
  })
}

export function useHoldingEvolution(id: string | null) {
  return useQuery({
    queryKey: [...INVESTMENTS_QUERY_KEY, 'evolution', id],
    queryFn: () => getHoldingEvolution(id as string),
    enabled: id !== null,
  })
}

export function useRedemptionPreview(id: string, params: RedemptionPreviewParams | null) {
  return useQuery({
    queryKey: [...INVESTMENTS_QUERY_KEY, 'redemption-preview', id, params],
    queryFn: () => previewRedemption(id, params as RedemptionPreviewParams),
    enabled: params !== null,
    // Prévia é cálculo puro no servidor: um erro de validação não melhora repetindo.
    retry: false,
  })
}
