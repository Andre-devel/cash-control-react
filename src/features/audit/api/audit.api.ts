import { axiosInstance } from '@/services/http'
import type { AuditLogParams, AuditPage, SecuritySummary } from '@/features/audit/types/audit.types'

export async function getAuditLogs(params: AuditLogParams): Promise<AuditPage> {
  const response = await axiosInstance.get<AuditPage>('/audit', { params })
  return response.data
}

export async function getSecuritySummary(): Promise<SecuritySummary> {
  const response = await axiosInstance.get<SecuritySummary>('/audit/summary')
  return response.data
}
