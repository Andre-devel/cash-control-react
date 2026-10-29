import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
      alert
      title="Excluir parcelamento"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button type="button" variant="danger" loading={isPending} onClick={handleConfirm}>
            {isPending ? 'Excluindo…' : 'Excluir parcelamento'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 place-items-center rounded-md bg-overdue-soft text-overdue"
        >
          <Trash2 size={20} />
        </span>
        <p className="text-body-sm text-fg-muted">
          Excluir <strong className="text-fg">{series?.description}</strong> e todas as{' '}
          {series?.totalInstallments} parcelas? Elas saem também das faturas em aberto. Esta ação
          não pode ser desfeita.
        </p>
      </div>
      {error && (
        <div
          className="mt-3 rounded-md bg-overdue-soft px-4 py-3 text-body-sm text-overdue"
          role="alert"
        >
          {error}
        </div>
      )}
    </Modal>
  )
}
