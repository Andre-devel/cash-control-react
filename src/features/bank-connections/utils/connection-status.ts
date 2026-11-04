import type { BadgeKind } from '@/components/ui/badge'

/** Rótulo do status do item na Pluggy; status desconhecido aparece como veio. */
export const CONNECTION_STATUS: Record<string, { label: string; kind: BadgeKind }> = {
  UPDATED: { label: 'Atualizada', kind: 'paid' },
  UPDATING: { label: 'Atualizando', kind: 'info' },
  WAITING_USER_INPUT: { label: 'Aguardando você', kind: 'pending' },
  OUTDATED: { label: 'Desatualizada', kind: 'pending' },
  LOGIN_ERROR: { label: 'Precisa reconectar', kind: 'overdue' },
}

export function connectionStatus(status: string): { label: string; kind: BadgeKind } {
  return CONNECTION_STATUS[status] ?? { label: status, kind: 'muted' }
}

/** Status em que só um novo consentimento no widget resolve. */
export const NEEDS_RECONNECT = new Set(['LOGIN_ERROR', 'OUTDATED', 'WAITING_USER_INPUT'])

/** Antecedência com que o card destaca o consentimento e oferece "Renovar". */
export const CONSENT_WARNING_DAYS = 15
const DAY_MS = 24 * 60 * 60 * 1000

/** Consentimento vencido ou faltando {@link CONSENT_WARNING_DAYS} dias ou menos. */
export function consentExpiringSoon(consentExpiresAt: string | null, now = Date.now()): boolean {
  if (!consentExpiresAt) return false
  const expiresAt = new Date(consentExpiresAt).getTime()
  if (Number.isNaN(expiresAt)) return false
  return expiresAt - now <= CONSENT_WARNING_DAYS * DAY_MS
}
