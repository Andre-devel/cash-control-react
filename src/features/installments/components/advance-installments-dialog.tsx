import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { useAdvanceInstallments } from '@/features/installments/hooks/use-advance-installments'
import { useInstallmentSeriesDetail } from '@/features/installments/hooks/use-installment-series-detail'
import type { InstallmentSeries } from '@/features/installments/types'

interface AdvanceInstallmentsDialogProps {
  series: InstallmentSeries | null
  open: boolean
  onClose: () => void
}

export function AdvanceInstallmentsDialog({
  series,
  open,
  onClose,
}: AdvanceInstallmentsDialogProps) {
  const { mutate: advanceInstallments, isPending } = useAdvanceInstallments()
  const { data: detail, isLoading: loadingDetail } = useInstallmentSeriesDetail(
    open ? series?.id : null,
  )

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [newDate, setNewDate] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [dateError, setDateError] = useState('')
  const [selectionError, setSelectionError] = useState('')

  const pendingTransactions = detail?.transactions.filter((t) => t.status === 'PENDING') ?? []

  function toggleId(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setSelectionError('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    let valid = true
    if (selectedIds.length === 0) {
      setSelectionError('Select at least one installment to advance.')
      valid = false
    }
    if (!newDate) {
      setDateError('New date is required.')
      valid = false
    }
    if (!valid) return

    advanceInstallments(
      { transactionIds: selectedIds, newDate, newAmount: newAmount || undefined },
      {
        onSuccess: () => {
          setSelectedIds([])
          setNewDate('')
          setNewAmount('')
          setDateError('')
          setSelectionError('')
          onClose()
        },
      },
    )
  }

  function handleClose() {
    setSelectedIds([])
    setNewDate('')
    setNewAmount('')
    setDateError('')
    setSelectionError('')
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Advance Installments"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="advance-installments-form"
            variant="primary"
            disabled={isPending || loadingDetail}
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
                Advancing…
              </>
            ) : (
              'Advance Installments'
            )}
          </Button>
        </>
      }
    >
      <p>
        Move selected installments of <strong>{series?.description}</strong> to a new due date.
      </p>

      <form
        id="advance-installments-form"
        onSubmit={handleSubmit}
        noValidate
        className="col gap-4"
        style={{ marginTop: 12 }}
      >
        {loadingDetail ? (
          <div
            className="animate-pulse"
            style={{ height: 80, background: 'var(--surface-3)', borderRadius: 4 }}
            aria-label="Loading installments"
          />
        ) : pendingTransactions.length === 0 ? (
          <p className="text-sm text-dim">No pending installments to advance.</p>
        ) : (
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="text-sm fw-500" style={{ marginBottom: 8 }}>
              Select installments to advance
            </legend>
            {selectionError && (
              <p className="text-xs" style={{ color: 'var(--expense)', marginBottom: 6 }}>
                {selectionError}
              </p>
            )}
            <div
              className="col gap-2"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 12px',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {pendingTransactions.map((t) => (
                <label
                  key={t.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(t.id)}
                    onChange={() => toggleId(t.id)}
                    aria-label={`Installment ${t.installmentNumber}: ${t.dueDate}`}
                  />
                  <span className="text-sm">
                    #{t.installmentNumber} — {t.dueDate}
                    <span className="text-dim" style={{ marginLeft: 8 }}>
                      {t.amount}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <Field label="New due date" error={dateError}>
          <Input
            type="date"
            value={newDate}
            onChange={(e) => {
              setNewDate(e.target.value)
              setDateError('')
            }}
            aria-label="New due date"
          />
        </Field>

        <Field label="New amount per installment (optional)">
          <Input
            type="text"
            placeholder="e.g. 350.00"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            aria-label="New amount per installment"
          />
        </Field>
      </form>
    </Modal>
  )
}
