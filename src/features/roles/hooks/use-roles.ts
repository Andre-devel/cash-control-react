import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getRoles } from '@/features/roles/api'
import { roleKeys } from '@/features/roles/api'
import type { PaginationParams } from '@/features/roles/types'

export function useRoles(params: PaginationParams) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => getRoles(params),
    placeholderData: keepPreviousData,
  })
}
