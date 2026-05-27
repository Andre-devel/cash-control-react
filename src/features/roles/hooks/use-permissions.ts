import { useQuery } from '@tanstack/react-query'
import { getPermissions, permissionKeys } from '@/features/roles/api'

export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.all,
    queryFn: getPermissions,
  })
}
