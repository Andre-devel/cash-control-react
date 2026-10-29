export const MONTH_NAMES_PT = [
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

export const MONTH_ABBR_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

/** Máscara de "Ocultar valores": mantém mais ou menos a largura de um valor. */
export const HIDDEN_MONEY = 'R$ ••••'

const pad = (n: number) => String(n).padStart(2, '0')

/** `Date` → `aaaa-mm`. */
export function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

/** `aaaa-mm` deslocado `delta` meses. */
export function shiftYearMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  return toYearMonth(new Date(y ?? 1970, (m ?? 1) - 1 + delta, 1))
}

/** Primeiro e último dia (`aaaa-mm-dd`) do mês `aaaa-mm`. */
export function monthRange(ym: string): { from: string; to: string } {
  const [y, m] = ym.split('-').map(Number)
  const last = new Date(y ?? 1970, m ?? 1, 0).getDate()
  return { from: `${ym}-01`, to: `${ym}-${pad(last)}` }
}

/** `aaaa-mm` → `out`. */
export function monthAbbr(ym: string): string {
  return MONTH_ABBR_PT[Number(ym.slice(5, 7)) - 1] ?? ym.slice(5, 7)
}

/** `aaaa-mm` → `outubro`. */
export function monthName(ym: string): string {
  return MONTH_NAMES_PT[Number(ym.slice(5, 7)) - 1] ?? ym
}

/** `aaaa-mm` → `out/26`. */
export function monthPillLabel(ym: string): string {
  return `${monthAbbr(ym)}/${ym.slice(2, 4)}`
}

/** Iniciais para o avatar: `André Martins` → `AM`. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || 'CC'
}
