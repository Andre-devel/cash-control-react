import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useArchiveCard } from '@/features/cards/hooks/use-archive-card'
import type { Card } from '@/features/cards/types'

interface ArchiveCardDialogProps {
  card: Card | null
  open: boolean
  onClose: () => void
}

export function ArchiveCardDialog({ card, open, onClose }: ArchiveCardDialogProps) {
  const { mutate: archiveCard, isPending } = useArchiveCard()

  function handleConfirm() {
    if (!card) return
    archiveCard(card.id, { onSuccess: () => onClose() })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive Card</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive <span className="font-semibold">{card?.name}</span>?
            The card's invoice history will remain accessible.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Archiving…
              </>
            ) : (
              'Archive Card'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
