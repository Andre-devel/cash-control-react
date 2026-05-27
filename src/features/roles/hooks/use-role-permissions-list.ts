import { useQuery } from '@tanstack/react-query'
import { getRolePermissions, roleKeys } from '@/features/roles/api'

export function useRolePermissionsList(roleId: string) {
  return useQuery({
    queryKey: roleKeys.rolePermissions(roleId),
    queryFn: () => getRolePermissions(roleId),
    enabled: Boolean(roleId),
  })
}
