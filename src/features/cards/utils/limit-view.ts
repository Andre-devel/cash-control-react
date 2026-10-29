import type { Card, LimitUsage } from '@/features/cards/types'

/** Um pedaço da barra de limite: o uso de um cartão dentro do grupo. */
export interface LimitSegment {
  cardId: string
  name: string
  used: number
}

/** O que a barra de limite mostra para um cartão, já resolvido o grupo compartilhado. */
export interface LimitView {
  limit: number
  used: number
  available: number
  /** Percentual usado, sem teto: acima de 100 é o que dispara a faixa `over`. */
  pct: number
  shared: boolean
  /** Uso por cartão do grupo, na ordem da lista de cartões. Vazio fora de grupo. */
  segments: LimitSegment[]
}

export type LimitTone = 'ok' | 'warn' | 'over'

/** Faixas de alerta do design: ≥ 85% `pending`, ≥ 100% `overdue-solid`. */
export function limitTone(pct: number): LimitTone {
  if (pct >= 100) return 'over'
  if (pct >= 85) return 'warn'
  return 'ok'
}

/**
 * Monta a visão de limite de um cartão.
 *
 * <p>O `/cards/{id}/limit` devolve, num cartão de grupo, o limite do GRUPO mas o uso só
 * DESTE cartão. A barra do grupo precisa do uso somado, então os usos dos outros cartões
 * do grupo vêm de `usageByCard` — as mesmas consultas que cada cartão da lista já faz.
 */
export function limitViewFor(
  card: Card,
  allCards: Card[],
  usageByCard: Record<string, LimitUsage | undefined>,
): LimitView | null {
  const own = usageByCard[card.id]
  if (!own) return null

  const limit = parseFloat(own.creditLimit)

  if (!card.sharedLimitGroupId) {
    const used = parseFloat(own.usedLimit)
    const pct = own.usagePercentage
      ? parseFloat(own.usagePercentage)
      : limit > 0
        ? (used / limit) * 100
        : 0
    return {
      limit,
      used,
      available: parseFloat(own.availableLimit),
      pct,
      shared: false,
      segments: [],
    }
  }

  const members = allCards.filter(
    (c) => !c.archivedAt && c.sharedLimitGroupId === card.sharedLimitGroupId,
  )
  // O próprio cartão sempre entra, mesmo arquivado — é ele que está na tela.
  if (!members.some((c) => c.id === card.id)) members.unshift(card)

  const segments: LimitSegment[] = members.flatMap((member) => {
    const usage = usageByCard[member.id]
    return usage
      ? [{ cardId: member.id, name: member.name, used: parseFloat(usage.usedLimit) }]
      : []
  })
  const used = segments.reduce((sum, s) => sum + s.used, 0)

  return {
    limit,
    used,
    available: Math.max(0, limit - used),
    pct: limit > 0 ? (used / limit) * 100 : 0,
    shared: true,
    segments,
  }
}

/** Cor do percentual em cada faixa — status nunca só na barra. */
export const LIMIT_TONE_TEXT: Record<LimitTone, string> = {
  ok: 'text-fg',
  warn: 'text-pending',
  over: 'text-overdue',
}
