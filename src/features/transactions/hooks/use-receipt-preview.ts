import { useMutation } from '@tanstack/react-query'
import { previewReceipt } from '@/features/transactions/api/receipt-import.api'
import { toast } from '@/lib/toast'
import type { ReceiptPreviewResponse } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

interface PreviewReceiptInput {
  file: File
  accountId?: string
}

export function useReceiptPreview() {
  return useMutation<ReceiptPreviewResponse, NormalizedError, PreviewReceiptInput>({
    mutationFn: ({ file, accountId }) => previewReceipt(file, accountId),
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
