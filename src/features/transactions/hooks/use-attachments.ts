import { useQuery } from '@tanstack/react-query'
import { listAttachments } from '@/features/transactions/api/transactions.api'

export const attachmentsQueryKey = (transactionId: string) =>
  ['transactions', transactionId, 'attachments'] as const

export function useAttachments(transactionId: string | undefined) {
  return useQuery({
    queryKey: attachmentsQueryKey(transactionId ?? ''),
    queryFn: () => listAttachments(transactionId!),
    enabled: Boolean(transactionId),
  })
}
