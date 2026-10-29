/**
 * Paleta categórica do design system (`CAT.dark` em "Cash Control - Design System").
 *
 * A API grava a cor da categoria como hex (`@Size(max = 7)`) e outras telas pintam com
 * esse hex direto, então o seletor oferece os hex da paleta escura — os mesmos valores de
 * `--cc-cat-1..10` no tema escuro. O ideal seria gravar o token (`cat-3`) para a cor se
 * adaptar ao tema claro; enquanto isso, `categoryColorToken` reconhece esses hex.
 */
export const CATEGORY_PALETTE: { hex: string; name: string }[] = [
  { hex: '#5CE1B8', name: 'Menta' },
  { hex: '#7C9CFF', name: 'Azul' },
  { hex: '#FF9F6E', name: 'Laranja' },
  { hex: '#F7C948', name: 'Amarelo' },
  { hex: '#E879C9', name: 'Rosa' },
  { hex: '#4CC3F0', name: 'Ciano' },
  { hex: '#A98BFF', name: 'Violeta' },
  { hex: '#FF7B7B', name: 'Coral' },
  { hex: '#B5D36A', name: 'Lima' },
  { hex: '#9AA3B2', name: 'Cinza' },
]

export const DEFAULT_CATEGORY_COLOR = CATEGORY_PALETTE[0].hex

/** Índice 1..10 do token `--cc-cat-N` correspondente ao hex, ou `null` se for cor livre. */
export function categoryColorToken(hex?: string | null): number | null {
  if (!hex) return null
  const index = CATEGORY_PALETTE.findIndex((c) => c.hex.toLowerCase() === hex.toLowerCase())
  return index === -1 ? null : index + 1
}

/**
 * Cor para pintar na tela: hex da paleta vira o token (acompanha o tema claro/escuro);
 * qualquer outro hex gravado continua funcionando como está.
 */
export function categoryColorCss(hex?: string | null, alpha?: number): string {
  const token = categoryColorToken(hex)
  if (token !== null) {
    return alpha === undefined
      ? `rgb(var(--cc-cat-${token}))`
      : `rgb(var(--cc-cat-${token}) / ${alpha})`
  }
  const color = hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : 'rgb(var(--cc-cat-10))'
  return alpha === undefined
    ? color
    : `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`
}

/**
 * Cor livre sorteada para o botão "Aleatória": matiz qualquer com saturação e luminosidade
 * na faixa da paleta, para continuar legível sobre os fundos claro e escuro.
 */
export function randomCategoryColor(current?: string, random: () => number = Math.random): string {
  for (let attempt = 0; attempt < 5; attempt++) {
    const h = random() * 360
    const s = 0.55 + random() * 0.25
    const l = 0.55 + random() * 0.12
    const hex = hslToHex(h, s, l)
    if (hex.toLowerCase() !== current?.toLowerCase()) return hex
  }
  return hslToHex(random() * 360, 0.65, 0.6)
}

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase()
}
