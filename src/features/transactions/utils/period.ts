import { localIsoDate } from '@/lib/local-date'

/** Recorte de datas (competência) da tela de Transações. */
export type TransactionPeriod = { kind: 'month'; year: number; month: number } | { kind: 'all' }

/** Valor do parâmetro `period` na URL que desliga o recorte. Sem o parâmetro, vale o mês atual. */
export const ALL_PERIOD = 'all'

const MONTH_NAMES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

export function currentPeriod(today: Date = new Date()): TransactionPeriod {
  return { kind: 'month', year: today.getFullYear(), month: today.getMonth() }
}

/** Lê `period` da URL: `all`, `aaaa-mm` ou ausente/inválido (mês atual). */
export function parsePeriod(raw: string | null, today: Date = new Date()): TransactionPeriod {
  if (raw === ALL_PERIOD) return { kind: 'all' }
  const match = raw ? /^(\d{4})-(\d{2})$/.exec(raw) : null
  if (match) {
    const month = Number(match[2]) - 1
    if (month >= 0 && month <= 11) return { kind: 'month', year: Number(match[1]), month }
  }
  return currentPeriod(today)
}

export function serializePeriod(period: TransactionPeriod): string {
  if (period.kind === 'all') return ALL_PERIOD
  return `${period.year}-${String(period.month + 1).padStart(2, '0')}`
}

export function shiftPeriod(period: TransactionPeriod, delta: number): TransactionPeriod {
  if (period.kind === 'all') return period
  const date = new Date(period.year, period.month + delta, 1)
  return { kind: 'month', year: date.getFullYear(), month: date.getMonth() }
}

/** Primeiro e último dia do mês, no formato da API. Sem limites para "todo o período". */
export function periodRange(period: TransactionPeriod): {
  competenceDateFrom?: string
  competenceDateTo?: string
} {
  if (period.kind === 'all') return {}
  return {
    competenceDateFrom: localIsoDate(new Date(period.year, period.month, 1)),
    competenceDateTo: localIsoDate(new Date(period.year, period.month + 1, 0)),
  }
}

export function periodLabel(period: TransactionPeriod): string {
  if (period.kind === 'all') return 'Todo o período'
  return `${MONTH_NAMES_PT[period.month]} de ${period.year}`
}
