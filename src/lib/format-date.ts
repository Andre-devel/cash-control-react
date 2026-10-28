/**
 * Data da API (`aaaa-mm-dd`, um LocalDate sem fuso) como `dd/mm/aaaa`.
 *
 * Não passa por `new Date(iso)`: o construtor lê essa forma como meia-noite UTC e, no fuso
 * do Brasil, a data exibida voltava um dia.
 */
export function formatLocalDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso
  return `${match[3]}/${match[2]}/${match[1]}`
}

/** Instante da API (ISO com hora) como data local `dd/mm/aaaa`. */
export function formatInstantDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('pt-BR')
}

const MONTH_ABBR = [
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

/** `aaaa-mm-dd` como `05 nov`, para listas onde o ano é óbvio. */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso
  return `${match[2]} ${MONTH_ABBR[Number(match[1]) - 1]}`
}

/** `aaaa-mm` (ou `aaaa-mm-dd`) como `set/2026`. */
export function formatYearMonth(iso: string | null | undefined): string {
  if (!iso) return '—'
  const match = /^(\d{4})-(\d{2})/.exec(iso)
  if (!match) return iso
  return `${MONTH_ABBR[Number(match[2]) - 1]}/${match[1]}`
}
