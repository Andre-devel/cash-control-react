import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

function formatAmount(amount: string): string {
  const num = parseFloat(amount)
  if (isNaN(num)) return amount
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

interface CardTileProps {
  card: CreditCard
  onEdit: (card: CreditCard) => void
  onArchive: (card: CreditCard) => void
}

export function CardTile({ card, onEdit, onArchive }: CardTileProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="w-3 h-3 rounded-full mt-1 shrink-0"
            style={{ backgroundColor: card.color }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{card.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {BRAND_LABELS[card.brand] ?? card.brand}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs font-mono text-muted-foreground">
                •••• {card.lastFourDigits}
              </span>
              {card.archived && (
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 border border-yellow-500 rounded px-1.5 py-0.5">
                  Archived
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-sm">
          <p className="text-xs text-muted-foreground">Credit Limit</p>
          <p className="font-mono font-semibold">{formatAmount(card.creditLimit)}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          <Button variant="outline" size="sm" className="text-xs min-h-[36px]" asChild>
            <Link to={ROUTES.CARD_DETAIL.replace(':id', card.id)}>View</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs min-h-[36px]"
            onClick={() => onEdit(card)}
          >
            Edit
          </Button>
          {!card.archived && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[36px]"
              onClick={() => onArchive(card)}
              aria-label={`Archive ${card.name}`}
            >
              Archive
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
