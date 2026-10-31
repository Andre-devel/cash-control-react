import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import { usePendingReimbursements } from '@/features/transactions/hooks/use-reimbursement'
import { fmtDateMedium } from '@/features/transactions/utils/transaction-display'
import type { Transaction } from '@/features/transactions/types'

interface PendingReimbursementsProps {
  /** Abre o diálogo de reembolso da despesa escolhida. */
  onSelect: (t: Transaction) => void
}

/** Aviso com o total que ainda falta voltar; abre a lista das despesas reembolsáveis pendentes. */
export function PendingReimbursements({ onSelect }: PendingReimbursementsProps) {
  const { data: pending = [] } = usePendingReimbursements()
  const [open, setOpen] = useState(false)

  if (pending.length === 0) return null
  const total = pending.reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <>
      <button
        type="button"
        className="flex min-h-touch items-center justify-between gap-3 rounded-xl border border-border bg-surface-1 px-4 py-2.5 text-left text-body-sm hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
        onClick={() => setOpen(true)}
      >
        <span>
          {pending.length === 1 ? '1 reembolso pendente' : `${pending.length} reembolsos pendentes`}{' '}
          · <Money value={total} /> a receber
        </span>
        <ChevronRight size={16} aria-hidden="true" className="text-fg-muted" />
      </button>

      {open && (
        <Modal
          title="Reembolsos pendentes"
          subtitle={
            <>
              <Money value={total} /> a receber
            </>
          }
          onClose={() => setOpen(false)}
        >
          <ul className="flex flex-col divide-y divide-border">
            {pending.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="flex min-h-touch w-full items-center gap-3 px-1 py-2 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
                  onClick={() => {
                    setOpen(false)
                    onSelect(t)
                  }}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-body">{t.description}</span>
                    <span className="text-caption text-fg-muted">
                      {fmtDateMedium(t.competenceDate)}
                      {t.accountName ? ` · ${t.accountName}` : ''}
                    </span>
                  </span>
                  <Money value={Number(t.amount)} />
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  )
}
