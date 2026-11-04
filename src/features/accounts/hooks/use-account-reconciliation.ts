import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccountReconciliation, reconcileAccount } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { AccountReconciliation } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

/** Sob `ACCOUNTS_QUERY_KEY`: qualquer mutação de conta já a invalida por prefixo. */
export function accountReconciliationKey(id: string) {
  return [...ACCOUNTS_QUERY_KEY, id, 'reconciliation'] as const
}

export function useAccountReconciliation(id: string) {
  return useQuery({
    queryKey: accountReconciliationKey(id),
    queryFn: () => getAccountReconciliation(id),
    enabled: !!id,
  })
}

export function useReconcileAccount() {
  const queryClient = useQueryClient()

  return useMutation<AccountReconciliation, NormalizedError, string>({
    mutationFn: (id) => reconcileAccount(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(accountReconciliationKey(id), data)
      invalidateFinancialQueries(queryClient, [ACCOUNTS_QUERY_KEY, TRANSACTIONS_QUERY_KEY])
      toast.success('Saldo ajustado para bater com o banco.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
