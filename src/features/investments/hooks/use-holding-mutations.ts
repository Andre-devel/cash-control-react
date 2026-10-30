import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createHolding,
  deleteHolding,
  redeemHolding,
  setManualValue,
  updateHolding,
} from '@/features/investments/api/investments.api'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { toast } from '@/lib/toast'
import type { NormalizedError } from '@/features/auth/types'
import type {
  FixedIncomeHolding,
  HoldingRequest,
  ManualValueRequest,
  RedeemRequest,
} from '@/features/investments/types'
import { INVESTMENTS_QUERY_KEY } from './use-investments'

/**
 * Aplicar e resgatar movem dinheiro entre contas e gravam rendimento: invalida contas,
 * transações e o dashboard junto com os investimentos.
 */
function useInvestmentMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  successMessage: string,
) {
  const queryClient = useQueryClient()
  return useMutation<TData, NormalizedError, TVariables>({
    mutationFn,
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [
        INVESTMENTS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
        TRANSACTIONS_QUERY_KEY,
      ])
      toast.success(successMessage)
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}

export function useCreateHolding() {
  return useInvestmentMutation<FixedIncomeHolding, HoldingRequest>(
    createHolding,
    'Aplicação registrada.',
  )
}

export function useUpdateHolding() {
  return useInvestmentMutation<FixedIncomeHolding, { id: string; data: HoldingRequest }>(
    ({ id, data }) => updateHolding(id, data),
    'Aplicação atualizada.',
  )
}

export function useDeleteHolding() {
  return useInvestmentMutation<void, string>(deleteHolding, 'Aplicação excluída.')
}

export function useSetManualValue() {
  return useInvestmentMutation<FixedIncomeHolding, { id: string; data: ManualValueRequest }>(
    ({ id, data }) => setManualValue(id, data),
    'Valor atualizado.',
  )
}

export function useRedeemHolding() {
  return useInvestmentMutation<FixedIncomeHolding, { id: string; data: RedeemRequest }>(
    ({ id, data }) => redeemHolding(id, data),
    'Resgate registrado.',
  )
}
