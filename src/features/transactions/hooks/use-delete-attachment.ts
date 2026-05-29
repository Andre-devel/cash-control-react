import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteAttachment } from '@/features/transactions/api/transactions.api'
import { toast } from '@/lib/toast'
import { attachmentsQueryKey } from './use-attachments'
import type { NormalizedError } from '@/features/auth/types'

export function useDeleteAttachment(transactionId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: (attachmentId) => deleteAttachment(transactionId, attachmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attachmentsQueryKey(transactionId) })
      toast.success('Attachment deleted.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
