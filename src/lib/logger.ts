export const LOG_EVENTS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SESSION_RESTORED: 'SESSION_RESTORED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED_ROUTE_ACCESS_ATTEMPT: 'UNAUTHORIZED_ROUTE_ACCESS_ATTEMPT',
  FORBIDDEN_ROUTE_ACCESS_ATTEMPT: 'FORBIDDEN_ROUTE_ACCESS_ATTEMPT',
} as const

export type LogEventName = (typeof LOG_EVENTS)[keyof typeof LOG_EVENTS]

const SENSITIVE_KEYS = new Set(['token', 'password', 'confirmpassword', 'authorization'])

function stripSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !SENSITIVE_KEYS.has(key.toLowerCase())),
  )
}

interface LogEntry {
  event: LogEventName
  correlationId?: string
  [key: string]: unknown
}

function log(entry: LogEntry): void {
  const { event, correlationId, ...rest } = entry
  const safe = stripSensitive(rest)
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      correlationId: correlationId ?? crypto.randomUUID(),
      ...safe,
    }),
  )
}

export const logger = { log }
