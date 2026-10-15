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
