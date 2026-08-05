import { useMutation } from '@tanstack/react-query'
import { previewStatementImport } from '@/features/transactions/api/statement-import.api'
import { toast } from '@/lib/toast'
import type { ImportPreviewResponse, StatementFormat } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

interface PreviewVariables {
  file: File
  accountId: string
  format: StatementFormat
}

/**
 * Analisa o extrato e devolve a prévia. Não invalida nada no cache porque nada
 * foi gravado — quem persiste é `useCommitStatementImport`.
 */
export function useStatementImportPreview() {
  return useMutation<ImportPreviewResponse, NormalizedError, PreviewVariables>({
    mutationFn: ({ file, accountId, format }) => previewStatementImport(file, accountId, format),
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
