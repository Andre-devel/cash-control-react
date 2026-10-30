import { useMutation, useQuery } from '@tanstack/react-query'
import {
  listBankBills,
  previewBankFatura,
  previewFaturaImport,
} from '@/features/cards/api/fatura-import.api'
import { toast } from '@/lib/toast'
import type {
  BankBill,
  FaturaImportPreviewResponse,
  InvoiceImportFormat,
} from '@/features/cards/types'
import type { NormalizedError } from '@/features/auth/types'

interface PreviewVariables {
  file: File
  format: InvoiceImportFormat
}

/**
 * Analisa o PDF da fatura e devolve a prévia. Não invalida nada no cache porque nada
 * foi gravado — quem persiste é `useCommitFaturaImport`.
 */
export function useFaturaImportPreview() {
  return useMutation<FaturaImportPreviewResponse, NormalizedError, PreviewVariables>({
    mutationFn: ({ file, format }) => previewFaturaImport(file, format),
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}

/** Faturas fechadas no banco do cartão vinculado. Só busca quando `cardId` vem preenchido. */
export function useBankBills(cardId: string | null) {
  return useQuery<BankBill[], NormalizedError>({
    queryKey: ['cards', cardId, 'bank-bills'],
    queryFn: () => listBankBills(cardId as string),
    enabled: cardId !== null,
  })
}

/** A prévia a partir de uma fatura do banco (Pluggy); também não grava nada. */
export function useBankFaturaPreview() {
  return useMutation<
    FaturaImportPreviewResponse,
    NormalizedError,
    { cardId: string; billId: string }
  >({
    mutationFn: ({ cardId, billId }) => previewBankFatura(cardId, billId),
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
