import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGoal, deleteGoal, unarchiveGoal, updateGoal } from '@/features/goals/api/goals.api'
import type { NormalizedError } from '@/features/auth/types'
import type { SaveGoalRequest } from '@/features/goals/types'
import { toast } from '@/lib/toast'
import { GOALS_QUERY_KEY } from './use-goals'

// Meta não move dinheiro: basta invalidar a própria lista.
function useGoalMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  successMessage: string,
) {
  const queryClient = useQueryClient()
  return useMutation<TResult, NormalizedError, TVariables>({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY })
      toast.success(successMessage)
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}

export function useCreateGoal() {
  return useGoalMutation((data: SaveGoalRequest) => createGoal(data), 'Meta criada.')
}

export function useUpdateGoal() {
  return useGoalMutation(
    ({ id, data }: { id: string; data: SaveGoalRequest }) => updateGoal(id, data),
    'Meta salva.',
  )
}

/** `archives` só escolhe o texto do aviso: quem decide entre arquivar e apagar é a API. */
export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation<void, NormalizedError, { id: string; archives: boolean }>({
    mutationFn: ({ id }) => deleteGoal(id),
    onSuccess: (_, { archives }) => {
      void queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY })
      toast.success(archives ? 'Meta arquivada.' : 'Meta excluída.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}

export function useUnarchiveGoal() {
  return useGoalMutation((id: string) => unarchiveGoal(id), 'Meta reativada.')
}
