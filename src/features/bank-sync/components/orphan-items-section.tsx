import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  useBankOrphanItems,
  useDeleteBankOrphanItem,
} from '@/features/bank-sync/hooks/use-bank-sync'
import { relativeDay } from '@/features/bank-sync/utils/describe-run'
import type { BankOrphanItem } from '@/features/bank-sync/types'

const CARD = 'rounded-xl border border-border bg-surface-1'

/** Itens que a Pluggy guarda para o usuário sem conexão no app; some quando não há nenhum. */
export function OrphanItemsSection() {
  const { data } = useBankOrphanItems()
  const [deleting, setDeleting] = useState<BankOrphanItem | null>(null)

  if (!data?.length) return null

  return (
    <section aria-labelledby="bank-sync-orphans" className={`${CARD} mb-6 min-w-0 overflow-hidden`}>
      <header className="border-b border-border px-4 py-3 md:px-5">
        <h2 id="bank-sync-orphans" className="m-0 font-display text-h3 font-bold">
          Itens na Pluggy sem conexão no app
        </h2>
        <p className="m-0 text-caption text-fg-muted">
          Conexões abertas no widget que não chegaram ao app. Apague para a Pluggy parar de ler o
          banco por elas.
        </p>
      </header>
      <ul className="m-0 list-none p-0" aria-label="Itens sem conexão">
        {data.map((item) => (
          <li
            key={item.itemId}
            className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 md:px-5"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-body-sm font-semibold">
                {item.connectorName ?? 'Banco'}
              </span>
              <span className="text-caption text-fg-muted">
                <span className="font-mono">{item.itemId.slice(0, 8)}…</span> · apareceu{' '}
                {relativeDay(item.firstSeenAt)}
              </span>
            </div>
            <Button
              variant="ghost"
              className="min-h-touch"
              leading={<Trash2 size={16} aria-hidden="true" />}
              onClick={() => setDeleting(item)}
            >
              Apagar na Pluggy
            </Button>
          </li>
        ))}
      </ul>
      {deleting && <DeleteOrphanDialog item={deleting} onClose={() => setDeleting(null)} />}
    </section>
  )
}

function DeleteOrphanDialog({ item, onClose }: { item: BankOrphanItem; onClose: () => void }) {
  const remove = useDeleteBankOrphanItem()

  return (
    <Modal
      alert
      title="Apagar item na Pluggy"
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
            loading={remove.isPending}
            onClick={() => remove.mutate(item.itemId, { onSuccess: onClose })}
          >
            Apagar
          </Button>
        </>
      }
    >
      <p>
        O item de <strong>{item.connectorName ?? 'este banco'}</strong> é apagado na Pluggy e o
        consentimento dele é revogado. Nada muda nas conexões nem nos lançamentos do app.
      </p>
    </Modal>
  )
}
