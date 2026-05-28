import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCards } from '@/features/cards/hooks/use-cards'
import { CardTile } from '@/features/cards/components/card-tile'
import { CreateCardDialog } from '@/features/cards/components/create-card-dialog'
import { EditCardDialog } from '@/features/cards/components/edit-card-dialog'
import { ArchiveCardDialog } from '@/features/cards/components/archive-card-dialog'
import type { Card as CreditCard } from '@/features/cards/types'

function CardsSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading cards"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div className="card-b space-y-3 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full mt-1 bg-muted" />
              <div className="space-y-1 flex-1">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-7 w-14 rounded bg-muted" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CardsPage() {
  const { data: cards, isLoading, isError, refetch } = useCards()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CreditCard | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<CreditCard | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Credit Cards</h1>
        <Button size="sm" className="min-h-[44px]" onClick={() => setCreateOpen(true)}>
          New Card
        </Button>
      </div>

      {isLoading ? (
        <CardsSkeleton />
      ) : isError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-destructive">Failed to load credit cards.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : !cards || cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No credit cards found.</p>
          <Button size="sm" className="min-h-[44px]" onClick={() => setCreateOpen(true)}>
            Add your first card
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              onEdit={(c) => setEditTarget(c)}
              onArchive={(c) => setArchiveTarget(c)}
            />
          ))}
        </div>
      )}

      <CreateCardDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditCardDialog
        card={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
      />

      <ArchiveCardDialog
        card={archiveTarget}
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  )
}
