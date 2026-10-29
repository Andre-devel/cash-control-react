import type { CSSProperties } from 'react'
import { Link2 } from 'lucide-react'
import type { Card } from '@/features/cards/types'
import { BrandMark } from './brand-mark'
import '@/features/cards/cards.css'

/** Brilhos possíveis, em tokens de categoria — o id do cartão escolhe um, sempre o mesmo. */
const GLOWS = [3, 4, 2, 7, 6, 5, 9, 1]

function glowOf(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return GLOWS[Math.abs(hash) % GLOWS.length]
}

interface CardFaceProps {
  card: Card
  /** Título maior para o cartão de destaque da tela de detalhe. */
  large?: boolean
}

/**
 * O cartão como objeto físico: nome, emissor, selo de limite compartilhado, chip,
 * fechamento/vencimento e bandeira, na proporção ISO (1,586). Puramente visual — quem
 * o envolve decide se é botão, link ou nada.
 */
export function CardFace({ card, large = false }: CardFaceProps) {
  return (
    <div
      className="cc-card-face"
      style={{ '--face-glow': `var(--cc-cat-${glowOf(card.id)})` } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span
            className={`truncate font-display font-bold leading-none ${large ? 'text-[19px]' : 'text-[17px]'}`}
          >
            {card.name}
          </span>
          {card.issuer && (
            <span className="cc-card-face-muted truncate text-[12px] leading-none">
              {card.issuer}
            </span>
          )}
        </div>
        {card.sharedLimitGroupId && (
          <span className="cc-card-face-pill">
            <Link2 size={12} aria-hidden="true" />
            Limite compartilhado
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="cc-card-face-chip" aria-hidden="true" />
        {card.last4Digits && (
          <span className="cc-card-face-muted font-mono text-[13px] tracking-wider">
            •••• {card.last4Digits}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="cc-card-face-muted text-[11px] font-medium leading-snug">
          Fecha dia {String(card.closingDay).padStart(2, '0')}
          <br />
          Vence dia {String(card.dueDay).padStart(2, '0')}
        </span>
        <span className="cc-card-face-brand">
          <BrandMark brand={card.brand} height={large ? 28 : 22} />
        </span>
      </div>
    </div>
  )
}
