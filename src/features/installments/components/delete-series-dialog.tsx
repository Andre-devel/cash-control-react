import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useDeleteSeries } from '@/features/installments/hooks/use-delete-series'
import type { InstallmentSeries } from '@/features/installments/types'

interface DeleteSeriesDialogProps {
  series: InstallmentSeries | null
  open: boolean
  onClose: () => void
}

export function DeleteSeriesDialog({ series, open, onClose }: DeleteSeriesDialogProps) {
  const { mutate: deleteSeries, isPending } = useDeleteSeries()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    if (!series) return
    setError(null)
    deleteSeries(series.id, {
      onSuccess: onClose,
      onError: (err) => {
        if (err.status < 500) setError(err.message)
      },
    })
  }

  function handleClose() {
    setError(null)
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Excluir parcelamento"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
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
            {isPending ? 'Excluindo…' : 'Excluir parcelamento'}
          </Button>
        </>
      }
    >
      <p>
        Excluir <strong>{series?.description}</strong> e todas as {series?.totalInstallments}{' '}
        parcelas? Elas saem também das faturas em aberto. Esta ação não pode ser desfeita.
      </p>
      {error && (
        <div
          className="rounded px-4 py-3 text-sm"
          style={{
            border: '1px solid var(--expense-soft)',
            background: 'var(--expense-soft)',
            color: 'var(--expense)',
            marginTop: 12,
          }}
          role="alert"
        >
          {error}
        </div>
      )}
    </Modal>
  )
}
