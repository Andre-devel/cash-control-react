import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useSettleSeries } from '@/features/installments/hooks/use-settle-series'
import type { InstallmentSeries } from '@/features/installments/types'

interface SettleSeriesDialogProps {
  series: InstallmentSeries | null
  open: boolean
  onClose: () => void
}

export function SettleSeriesDialog({ series, open, onClose }: SettleSeriesDialogProps) {
  const { mutate: settleSeries, isPending } = useSettleSeries()

  const remaining = series ? series.installmentCount - series.paidCount : 0

  function handleConfirm() {
    if (!series) return
    settleSeries(series.id, { onSuccess: () => onClose() })
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settle Series Early</DialogTitle>
          <DialogDescription>
            You are about to settle <span className="font-semibold">{series?.description}</span>{' '}
            early.
          </DialogDescription>
        </DialogHeader>

        {series && (
          <div className="rounded-md border border-border bg-muted/40 px-4 py-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining installments</span>
              <span className="font-medium">{remaining}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Settlement amount</span>
              <span className="font-semibold tabular-nums">{series.remainingAmount}</span>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          All remaining installments will be cancelled and a single settlement transaction will be
          recorded. This action cannot be undone.
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            aria-busy={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Settling…
              </>
            ) : (
              'Settle Early'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
