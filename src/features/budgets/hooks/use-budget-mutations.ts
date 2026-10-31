import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteBudget, saveBudget } from '@/features/budgets/api/budgets.api'
import type { NormalizedError } from '@/features/auth/types'
import type { SaveBudgetRequest } from '@/features/budgets/types'
import { toast } from '@/lib/toast'
import { BUDGETS_QUERY_KEY } from './use-budgets'

function useBudgetMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<void>,
  successMessage: string,
) {
  const queryClient = useQueryClient()
  return useMutation<void, NormalizedError, TVariables>({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BUDGETS_QUERY_KEY })
      toast.success(successMessage)
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}

/**
 * `clearMonth` apaga o ajuste daquele mês depois de gravar: quem troca um ajuste por
 * "todo mês" espera ver o valor novo já no mês aberto, e o ajuste venceria o padrão.
 */
export function useSaveBudget() {
  return useBudgetMutation<{ categoryId: string; data: SaveBudgetRequest; clearMonth?: string }>(
    async ({ categoryId, data, clearMonth }) => {
      await saveBudget(categoryId, data)
      if (clearMonth) await deleteBudget(categoryId, clearMonth)
    },
    'Orçamento salvo.',
  )
}

export function useDeleteBudget() {
  return useBudgetMutation<{ categoryId: string; month: string | null }>(
    ({ categoryId, month }) => deleteBudget(categoryId, month),
    'Orçamento removido.',
  )
}
