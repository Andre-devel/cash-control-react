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
  OTHER: 'Outro',
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
          <div className="min-w-0 flex-1">
            <p className="fw-600 truncate">{card.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-dim">{BRAND_LABELS[card.brand] ?? card.brand}</span>
              {card.issuer && (
                <>
                  <span className="text-xs text-dim">·</span>
                  <span className="text-xs text-dim">{card.issuer}</span>
                </>
              )}
              {card.archivedAt && (
                <Badge kind="pending" dot={false} square>
                  Arquivado
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-sm">
          <p className="text-xs text-dim">Limite de crédito</p>
          <p className="mono fw-600">{card.creditLimit}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to={ROUTES.CARD_DETAIL.replace(':id', card.id)}
              aria-label={`Ver detalhes de ${card.name}`}
            >
              Ver
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(card)}
            aria-label={`Editar ${card.name}`}
          >
            Editar
          </Button>
          {!card.archivedAt && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive(card)}
              aria-label={`Arquivar ${card.name}`}
            >
              Arquivar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
