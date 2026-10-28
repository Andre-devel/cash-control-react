import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAccount } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { reportMutationError, type MutationFormOptions } from '@/lib/form-errors'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { UpdateAccountRequest, Account } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

interface UpdateAccountVariables {
  id: string
  data: UpdateAccountRequest
}

export function useUpdateAccount(options?: MutationFormOptions) {
  const queryClient = useQueryClient()

  return useMutation<Account, NormalizedError, UpdateAccountVariables>({
    mutationFn: ({ id, data }) => updateAccount(id, data),
    onSuccess: (_, { id }) => {
      invalidateFinancialQueries(queryClient, [ACCOUNTS_QUERY_KEY, [...ACCOUNTS_QUERY_KEY, id]])
      toast.success('Conta atualizada com sucesso.')
    },
    onError: (error) => reportMutationError(error, options?.onFieldError),
  })
}
