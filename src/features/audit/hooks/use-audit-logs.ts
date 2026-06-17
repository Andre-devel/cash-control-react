import { useQuery } from '@tanstack/react-query'
import { getAuditLogs } from '@/features/audit/api/audit.api'
import type { AuditLogParams } from '@/features/audit/types/audit.types'

export function useAuditLogs(params: AuditLogParams) {
  return useQuery({
    queryKey: ['audit', 'logs', params],
    queryFn: () => getAuditLogs(params),
    staleTime: 30_000,
  })
}
