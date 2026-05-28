import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import type { Card as CreditCard } from '@/features/cards/types'

const BRAND_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'Amex',
  HIPERCARD: 'Hipercard',
  OTHER: 'Other',
}

interface CardTileProps {
  card: CreditCard
  onEdit: (card: CreditCard) => void
  onArchive: (card: CreditCard) => void
}

export function CardTile({ card, onEdit, onArchive }: CardTileProps) {
  return (
    <div className="card">
      <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="flex items-start gap-3">
          <div
            className="w-3 h-3 rounded-full mt-1 shrink-0"
            style={{ backgroundColor: card.color }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="fw-600 truncate">{card.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-dim">{BRAND_LABELS[card.brand] ?? card.brand}</span>
              <span className="text-xs text-dim">·</span>
              <span className="text-xs mono text-dim">•••• {card.lastFourDigits}</span>
              {card.archived && (
                <Badge kind="pending" dot={false} square>
                  Archived
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-sm">
          <p className="text-xs text-dim">Credit Limit</p>
          <p className="mono fw-600">{card.creditLimit}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to={ROUTES.CARD_DETAIL.replace(':id', card.id)}
              aria-label={`View details for ${card.name}`}
            >
              View
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(card)}
            aria-label={`Edit ${card.name}`}
          >
            Edit
          </Button>
          {!card.archived && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive(card)}
              aria-label={`Archive ${card.name}`}
            >
              Archive
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
