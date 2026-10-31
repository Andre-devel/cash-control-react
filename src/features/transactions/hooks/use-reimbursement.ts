import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listPendingReimbursements,
  listReimbursementCandidates,
  setReimbursement,
} from '@/features/transactions/api/transactions.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import type { SetReimbursementRequest, Transaction } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

const REIMBURSEMENTS_QUERY_KEY = [...TRANSACTIONS_QUERY_KEY, 'reimbursements'] as const

/** Despesas reembolsáveis que ainda esperam o dinheiro voltar. */
export function usePendingReimbursements() {
  return useQuery({
    queryKey: [...REIMBURSEMENTS_QUERY_KEY, 'pending'],
    queryFn: listPendingReimbursements,
  })
}

/** Receitas que podem ser vinculadas como reembolso da despesa, de valor mais próximo primeiro. */
export function useReimbursementCandidates(expenseId: string | undefined) {
  return useQuery({
    queryKey: [...REIMBURSEMENTS_QUERY_KEY, 'candidates', expenseId],
    queryFn: () => listReimbursementCandidates(expenseId!),
    enabled: Boolean(expenseId),
  })
}

interface SetReimbursementVariables extends SetReimbursementRequest {
  id: string
}

/** Marca, desmarca, vincula ou desvincula — o corpo substitui o estado do reembolso. */
export function useSetReimbursement() {
  const queryClient = useQueryClient()

  return useMutation<Transaction, NormalizedError, SetReimbursementVariables>({
    mutationFn: ({ id, ...body }) => setReimbursement(id, body),
    onSuccess: (tx) => {
      // Tira (ou devolve) a despesa e a receita dos gráficos e do orçamento.
      invalidateFinancialQueries(queryClient, [TRANSACTIONS_QUERY_KEY])
      const r = tx.reimbursement
      toast.success(
        !r
          ? 'A despesa voltou a contar como gasto.'
          : r.linkedTransactionId
            ? 'Reembolso vinculado.'
            : 'Despesa marcada como reembolsável.',
      )
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
