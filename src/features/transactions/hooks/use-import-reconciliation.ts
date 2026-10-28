import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  applyImportReconciliation,
  getImportReconciliation,
} from '@/features/transactions/api/import-reconciliation.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { CARDS_QUERY_KEY } from '@/features/cards/hooks/use-cards'
import { INSTALLMENTS_QUERY_KEY } from '@/features/installments/hooks/use-installment-series'
import type {
  ApplyReconciliationRequest,
  ApplyReconciliationResult,
} from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

export const IMPORT_RECONCILIATION_QUERY_KEY = ['transactions', 'import-reconciliation'] as const

export function useImportReconciliation(enabled: boolean) {
  return useQuery({
    queryKey: IMPORT_RECONCILIATION_QUERY_KEY,
    queryFn: getImportReconciliation,
    enabled,
    // A análise é do banco inteiro do usuário: sempre fresca ao abrir.
    staleTime: 0,
  })
}

export function useApplyImportReconciliation() {
  const queryClient = useQueryClient()

  return useMutation<ApplyReconciliationResult, NormalizedError, ApplyReconciliationRequest>({
    mutationFn: applyImportReconciliation,
    onSuccess: (result) => {
      invalidateFinancialQueries(queryClient, [
        TRANSACTIONS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
        CARDS_QUERY_KEY,
        INSTALLMENTS_QUERY_KEY,
        IMPORT_RECONCILIATION_QUERY_KEY,
      ])
      const parts = [
        result.invoicePayments > 0 && `${result.invoicePayments} pagamento(s) de fatura`,
        result.investments > 0 && `${result.investments} aplicação(ões)/resgate(s)`,
        result.seriesMerged > 0 && `${result.seriesMerged} parcelamento(s) unificado(s)`,
      ].filter(Boolean)
      toast.success(parts.length > 0 ? `Corrigidos: ${parts.join(', ')}.` : 'Nada a corrigir.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
