import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useSettleSeries } from '@/features/installments/hooks/use-settle-series'
import type { InstallmentSeries } from '@/features/installments/types'

interface SettleSeriesDialogProps {
  series: InstallmentSeries | null
  open: boolean
  onClose: () => void
}

export function SettleSeriesDialog({ series, open, onClose }: SettleSeriesDialogProps) {
  const { mutate: settleSeries, isPending } = useSettleSeries()

  const remaining = series ? series.totalInstallments : 0

  function handleConfirm() {
    if (!series) return
    settleSeries(series.id, { onSuccess: () => onClose() })
  }

  if (!open) return null

  return (
    <Modal
      title="Liquidar série antecipadamente"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="button"
            variant="danger"
            disabled={isPending}
            aria-busy={isPending}
            onClick={handleConfirm}
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
                Liquidando…
              </>
            ) : (
              'Liquidar antecipadamente'
            )}
          </Button>
        </>
      }
    >
      <p>
        Você está prestes a liquidar <strong>{series?.description}</strong> antecipadamente.
      </p>

      {series && (
        <div
          className="rounded space-y-1 text-sm"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface-3)',
            padding: '12px 16px',
            marginTop: 12,
          }}
        >
          <div className="flex justify-between">
            <span className="text-dim">Total de parcelas</span>
            <span className="font-medium">{remaining}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">Valor total</span>
            <span className="font-semibold tabular-nums">{series.totalAmount}</span>
          </div>
        </div>
      )}

      <p className="text-sm text-dim" style={{ marginTop: 12 }}>
        Todas as parcelas restantes serão canceladas e uma única transação de liquidação será
        registrada. Esta ação não pode ser desfeita.
      </p>
    </Modal>
  )
}
