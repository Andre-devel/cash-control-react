import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransfer } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { CreateTransferRequest } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCreateTransfer() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, CreateTransferRequest>({
    mutationFn: createTransfer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      toast.success('Transfer completed successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
