import { useRef, useState, type ChangeEvent } from 'react'
import { ArrowLeftRight, FileUp, Plus, ScanLine, SquarePen } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { CreateTransactionDialog } from '@/features/transactions/components/create-transaction-dialog'
import { ReceiptReviewDialog } from '@/features/transactions/components/receipt-review-dialog'
import { ImportStatementDialog } from '@/features/transactions/components/import-statement-dialog'
import { ImportReconciliationDialog } from '@/features/transactions/components/import-reconciliation-dialog'
import { CreateTransferDialog } from '@/features/accounts/components/create-transfer-dialog'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import type { NavIcon } from './nav-config'

type QuickAction = 'transaction' | 'transfer' | 'import' | 'reconcile'

/** Montado só quando aberto: evita buscar as contas a cada página. */
function TransferQuickAction({ onClose }: { onClose: () => void }) {
  const { data: accounts = [] } = useAccounts()
  return (
    <CreateTransferDialog open defaultFromAccount={null} accounts={accounts} onClose={onClose} />
  )
}

/**
 * FAB central da barra inferior (celular) e seu menu de ações rápidas: nova transação,
 * lançar comprovante (câmera/galeria), transferência e importar extrato. Os diálogos só
 * montam quando escolhidos, então o FAB não dispara nenhuma consulta sozinho.
 */
export function QuickActionsFab() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState<QuickAction | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function choose(action: QuickAction) {
    setMenuOpen(false)
    setActive(action)
  }

  function pickReceipt() {
    setMenuOpen(false)
    // Precisa acontecer dentro do clique: navegadores só abrem o seletor com gesto do usuário.
    fileInputRef.current?.click()
  }

  function handleReceiptChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    if (file) setReceiptFile(file)
  }

  const close = () => setActive(null)

  const items: Array<{ icon: NavIcon; label: string; hint: string; onSelect: () => void }> = [
    {
      icon: SquarePen,
      label: 'Nova transação',
      hint: 'Receita ou despesa',
      onSelect: () => choose('transaction'),
    },
    {
      icon: ScanLine,
      label: 'Lançar comprovante',
      hint: 'Foto do comprovante vira lançamento',
      onSelect: pickReceipt,
    },
    {
      icon: ArrowLeftRight,
      label: 'Transferência',
      hint: 'Entre suas contas',
      onSelect: () => choose('transfer'),
    },
    {
      icon: FileUp,
      label: 'Importar extrato',
      hint: 'CSV do banco',
      onSelect: () => choose('import'),
    },
  ]

  return (
    <>
      <button
        type="button"
        className="fab"
        aria-label="Novo lançamento"
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(true)}
      >
        <Plus size={26} strokeWidth={2.25} aria-hidden="true" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleReceiptChange}
      />

      {menuOpen && (
        <Modal title="Novo lançamento" onClose={() => setMenuOpen(false)}>
          <div className="quick-actions">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className="quick-action"
                onClick={item.onSelect}
              >
                <span className="quick-action-ico" aria-hidden="true">
                  <item.icon size={20} />
                </span>
                <span className="quick-action-text">
                  <span className="quick-action-label">{item.label}</span>
                  <span className="quick-action-hint">{item.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {active === 'transaction' && <CreateTransactionDialog open onClose={close} />}
      {active === 'transfer' && <TransferQuickAction onClose={close} />}
      {active === 'import' && (
        <ImportStatementDialog open onClose={close} onReconcile={() => setActive('reconcile')} />
      )}
      {active === 'reconcile' && <ImportReconciliationDialog open onClose={close} />}
      {receiptFile && (
        <ReceiptReviewDialog open file={receiptFile} onClose={() => setReceiptFile(null)} />
      )}
    </>
  )
}
