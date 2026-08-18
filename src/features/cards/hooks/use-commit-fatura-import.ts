import { useMutation, useQueryClient } from '@tanstack/react-query'
import { commitFaturaImport } from '@/features/cards/api/fatura-import.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { CARDS_QUERY_KEY } from './use-cards'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { INSTALLMENTS_QUERY_KEY } from '@/features/installments/hooks/use-installment-series'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import type { FaturaImportCommitRequest, FaturaImportResultResponse } from '@/features/cards/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCommitFaturaImport() {
  const queryClient = useQueryClient()

  return useMutation<FaturaImportResultResponse, NormalizedError, FaturaImportCommitRequest>({
    mutationFn: commitFaturaImport,
    onSuccess: (result) => {
      // Uma fatura inteira muda o total de duas faturas e o limite disponível de uma vez:
      // invalidar só a lista de cartões deixaria o dashboard defasado até o próximo
      // recarregamento. `CARDS_QUERY_KEY` é prefixo das chaves de fatura e limite, então
      // cobre as duas. Cada linha vira uma transação de cartão, e uma linha parcelada
      // ainda cria uma série — daí transações, parcelamentos e contas juntos.
      invalidateFinancialQueries(queryClient, [
        CARDS_QUERY_KEY,
        TRANSACTIONS_QUERY_KEY,
        INSTALLMENTS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
      ])

      const parts = [`${result.imported} lançamentos importados`]
      if (result.futureInstallments > 0) {
        parts.push(`${result.futureInstallments} parcelas futuras criadas`)
      }
      if (result.markedPaidInvoices > 0) {
        parts.push(
          result.markedPaidInvoices === 1
            ? 'fatura marcada como paga'
            : `${result.markedPaidInvoices} faturas marcadas como pagas`,
        )
      }
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
