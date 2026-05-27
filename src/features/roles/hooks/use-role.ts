import { useQuery } from '@tanstack/react-query'
import { getRoleById } from '@/features/roles/api'
import { roleKeys } from '@/features/roles/api'

export function useRole(roleId: string) {
  return useQuery({
    queryKey: roleKeys.detail(roleId),
    queryFn: () => getRoleById(roleId),
    enabled: Boolean(roleId),
  })
}
