import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '@/features/profile/api/profile.api'
import { toast } from '@/lib/toast'
import { PROFILE_QUERY_KEY } from './use-profile'
import type { UpdateProfileRequest, UserProfile } from '@/features/profile/types'
import type { NormalizedError } from '@/features/auth/types'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, NormalizedError, UpdateProfileRequest>({
    mutationFn: updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      toast.success('Profile updated successfully.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
