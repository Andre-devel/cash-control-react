import { useMutation, useQueryClient } from '@tanstack/react-query'
import { commitStatementImport } from '@/features/transactions/api/statement-import.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { CARDS_QUERY_KEY } from '@/features/cards/hooks/use-cards'
import type { ImportCommitRequest, ImportResultResponse } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCommitStatementImport() {
  const queryClient = useQueryClient()

  return useMutation<ImportResultResponse, NormalizedError, ImportCommitRequest>({
    mutationFn: commitStatementImport,
    onSuccess: (result) => {
      // Uma importação move centenas de valores de uma vez: invalidar só a lista
      // de transações deixaria o dashboard defasado até o próximo recarregamento.
      invalidateFinancialQueries(queryClient, [
        TRANSACTIONS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
        CARDS_QUERY_KEY,
      ])

      const parts = [`${result.imported} transações importadas`]
      if (result.skippedDuplicates > 0) {
        parts.push(`${result.skippedDuplicates} já existiam`)
      }
      if (result.failed > 0) {
        parts.push(`${result.failed} com erro`)
      }
      const message = `${parts.join(' · ')}.`

      if (result.failed > 0) {
        toast.warn(message)
      } else {
        toast.success(message)
      }
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
