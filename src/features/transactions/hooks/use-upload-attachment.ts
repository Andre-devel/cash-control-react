import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadAttachment } from '@/features/transactions/api/transactions.api'
import { toast } from '@/lib/toast'
import { attachmentsQueryKey } from './use-attachments'
import type { Attachment } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

export function useUploadAttachment(transactionId: string) {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)

  const mutation = useMutation<Attachment[], NormalizedError, File>({
    mutationFn: (file) => uploadAttachment(transactionId, file, setProgress),
    onSuccess: () => {
      setProgress(0)
      void queryClient.invalidateQueries({ queryKey: attachmentsQueryKey(transactionId) })
      toast.success('Attachment uploaded.')
    },
    onError: (error) => {
      setProgress(0)
      toast.error(error.message)
    },
  })

  return { ...mutation, progress }
}
