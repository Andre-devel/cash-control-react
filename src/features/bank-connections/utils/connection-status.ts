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
