import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmAllBankPending,
  confirmBankPending,
  countBankPending,
  discardBankPending,
  listBankPending,
} from '@/features/bank-connections/api/bank-pending.api'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { toast } from '@/lib/toast'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { CARDS_QUERY_KEY } from '@/features/cards/hooks/use-cards'
import type { ImportCommitRow } from '@/features/transactions/types'
import type {
  BankPendingConfirmAllResponse,
  BankPendingConfirmResponse,
} from '@/features/bank-connections/types'
import type { NormalizedError } from '@/features/auth/types'

/** Prefixo da fila: invalidar por ele atualiza a lista e o selo do menu. */
export const BANK_PENDING_QUERY_KEY = ['bank-pending'] as const
export const BANK_PENDING_COUNT_QUERY_KEY = ['bank-pending', 'count'] as const

/** O webhook do banco enche a fila sem o app saber; o selo relê de tempos em tempos. */
const COUNT_REFETCH_MS = 5 * 60 * 1000

export function useBankPending() {
  return useQuery({ queryKey: [...BANK_PENDING_QUERY_KEY, 'list'], queryFn: listBankPending })
}

export function useBankPendingCount() {
  return useQuery({
    queryKey: BANK_PENDING_COUNT_QUERY_KEY,
    queryFn: countBankPending,
    refetchInterval: COUNT_REFETCH_MS,
  })
}

function showError(error: NormalizedError) {
  toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
}

function useInvalidateAfterSave() {
  const queryClient = useQueryClient()
  // Confirmar grava lançamento (às vezes transferência ou pagamento de fatura).
  return () =>
    invalidateFinancialQueries(queryClient, [
      BANK_PENDING_QUERY_KEY,
      TRANSACTIONS_QUERY_KEY,
      ACCOUNTS_QUERY_KEY,
      CARDS_QUERY_KEY,
    ])
}

export function useConfirmBankPending() {
  const invalidate = useInvalidateAfterSave()
  return useMutation<
    BankPendingConfirmResponse,
    NormalizedError,
    { id: string; edits?: ImportCommitRow }
  >({
    mutationFn: ({ id, edits }) => confirmBankPending(id, edits),
    onSuccess: invalidate,
    onError: showError,
  })
}

export function useConfirmAllBankPending() {
  const invalidate = useInvalidateAfterSave()
  return useMutation<BankPendingConfirmAllResponse, NormalizedError, void>({
    mutationFn: confirmAllBankPending,
    onSuccess: (result) => {
      invalidate()
      const left = result.skipped > 0 ? ` · ${result.skipped} ficaram para revisar` : ''
      toast.success(`${result.confirmed} lançamentos gravados${left}.`)
    },
    onError: showError,
  })
}

export function useDiscardBankPending() {
  const queryClient = useQueryClient()
  return useMutation<void, NormalizedError, string>({
    mutationFn: discardBankPending,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: BANK_PENDING_QUERY_KEY }),
    onError: showError,
  })
}
