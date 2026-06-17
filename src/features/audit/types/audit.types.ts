export interface AuditLogEntry {
  id: string
  eventType: string
  outcome: string
  severity: string
  actorUserId: string | null
  targetUserId: string | null
  ipAddressMasked: string | null
  correlationId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface AuditPage {
  content: AuditLogEntry[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface SecuritySummary {
  lockedAccountsCount: number
  failedAttemptsLast24h: number
  forcedReAuthsLast24h: number
}

export interface AuditLogParams {
  page?: number
  size?: number
  eventTypeSlug?: string
  outcomeSlug?: string
  from?: string
  to?: string
}
