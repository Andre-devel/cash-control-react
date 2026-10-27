import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '@/features/profile/api/profile.api'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { PROFILE_QUERY_KEY } from './use-profile'
import type { UpdateProfileRequest, UserProfile } from '@/features/profile/types'
import type { NormalizedError } from '@/features/auth/types'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, NormalizedError, UpdateProfileRequest>({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      // A saudação e a sidebar leem o nome do store de sessão, não da query do perfil.
      const { user, setUser } = useAuthStore.getState()
      if (user) setUser({ ...user, name: profile.displayName })
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      toast.success('Perfil atualizado com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
