import type { CardBrand } from '@/features/cards/types'

const BRAND_NAME: Record<CardBrand, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'American Express',
  HIPERCARD: 'Hipercard',
  OTHER: '',
}

/**
 * Marca da bandeira impressa no cartão (sempre sobre fundo escuro). Desenho simplificado
 * em SVG — círculos da Mastercard e logotipos tipográficos das demais — no lugar dos
 * arquivos oficiais, que exigem o kit de marca de cada bandeira.
 */
export function BrandMark({ brand, height = 22 }: { brand: CardBrand; height?: number }) {
  if (brand === 'OTHER') return null
  const name = BRAND_NAME[brand]

  if (brand === 'MASTERCARD') {
    return (
      <svg role="img" aria-label={name} height={height} viewBox="0 0 40 24">
        <circle cx="14" cy="12" r="10" fill="#EB001B" />
        <circle cx="26" cy="12" r="10" fill="#F79E1B" />
        <path d="M20 4a10 10 0 0 1 0 16a10 10 0 0 1 0-16z" fill="#FF5F00" />
      </svg>
    )
  }

  const wordmark: Record<
    Exclude<CardBrand, 'MASTERCARD' | 'OTHER'>,
    { text: string; width: number; italic?: boolean; box?: string }
  > = {
    VISA: { text: 'VISA', width: 58, italic: true },
    ELO: { text: 'elo', width: 40 },
    AMEX: { text: 'AMEX', width: 62, box: '#2E77BC' },
    HIPERCARD: { text: 'Hipercard', width: 96, box: '#B3131B' },
  }
  const w = wordmark[brand]
  return (
    <svg role="img" aria-label={name} height={height} viewBox={`0 0 ${w.width} 24`}>
      {w.box && <rect width={w.width} height="24" rx="4" fill={w.box} />}
      <text
        x={w.width / 2}
        y="17.5"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="var(--cc-font-sans), system-ui, sans-serif"
        fontSize={w.box ? 14 : 19}
        fontWeight={800}
        fontStyle={w.italic ? 'italic' : 'normal'}
        letterSpacing={brand === 'ELO' ? 0 : 0.5}
      >
        {w.text}
      </text>
    </svg>
  )
}
