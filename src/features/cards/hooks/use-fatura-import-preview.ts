import { useMutation } from '@tanstack/react-query'
import { previewFaturaImport } from '@/features/cards/api/fatura-import.api'
import { toast } from '@/lib/toast'
import type { FaturaImportPreviewResponse, InvoiceImportFormat } from '@/features/cards/types'
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
