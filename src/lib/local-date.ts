/**
 * Data no fuso do navegador, no formato `aaaa-mm-dd` que a API usa.
 *
 * `toISOString()` converte para UTC antes de formatar: em Brasília, depois das 21h ele já
 * devolve o dia seguinte — e era isso que preenchia "hoje" nos formulários.
 */
export function localIsoDate(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * `aaaa-mm-dd` da API como meia-noite **local**.
 *
 * `new Date('2026-11-27')` lê a string como meia-noite UTC, que no Brasil ainda é dia 26 —
 * era assim que parcelas e recorrências apareciam um dia antes.
 */
export function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Dias corridos de hoje até `iso`; negativo quando a data já passou. */
export function daysUntil(iso: string, today: Date = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((parseLocalDate(iso).getTime() - start.getTime()) / 86_400_000)
}
