import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
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

  if (!open) return null

  return (
    <Modal
      title="Archive Card"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span
                  className="animate-spin"
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                  aria-hidden="true"
                />
                Archiving…
              </>
            ) : (
              'Archive Card'
            )}
          </Button>
        </>
      }
    >
      <p>
        Are you sure you want to archive <strong>{card?.name}</strong>? The card's invoice history
        will remain accessible.
      </p>
    </Modal>
  )
}
