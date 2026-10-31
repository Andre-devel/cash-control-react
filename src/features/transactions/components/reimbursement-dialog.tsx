import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import {
  useReimbursementCandidates,
  useSetReimbursement,
} from '@/features/transactions/hooks/use-reimbursement'
import { fmtDateMedium } from '@/features/transactions/utils/transaction-display'
import type { Transaction } from '@/features/transactions/types'

interface ReimbursementDialogProps {
  /** A despesa. Null fecha o diálogo. */
  transaction: Transaction | null
  onClose: () => void
}

/**
 * Reembolso de uma despesa: marcar como reembolsável (sai dos gráficos e do orçamento já),
 * vincular a receita que devolveu o dinheiro, desvincular ou voltar a contar como gasto.
 */
export function ReimbursementDialog({ transaction, onClose }: ReimbursementDialogProps) {
  const reimbursement = transaction?.reimbursement ?? null
  const isLinked = Boolean(reimbursement?.linkedTransactionId)
  const { data: candidates = [], isLoading } = useReimbursementCandidates(
    transaction && !isLinked ? transaction.id : undefined,
  )
  const { mutate, isPending } = useSetReimbursement()

  if (!transaction) return null

  const amount = Number(transaction.amount)
  const save = (reimbursable: boolean, reimbursedById: string | null = null) =>
    mutate({ id: transaction.id, reimbursable, reimbursedById }, { onSuccess: onClose })

  const notReturned = isLinked ? amount - Number(reimbursement?.linkedAmount) : 0

  return (
    <Modal
      title="Reembolso"
      subtitle={
        <>
          {transaction.description} · <Money value={-amount} signed />
        </>
      }
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <div className="spacer" />
          {reimbursement?.reimbursable ? (
            <>
              {isLinked && (
                <Button type="button" disabled={isPending} onClick={() => save(true)}>
                  Desvincular
                </Button>
              )}
              <Button type="button" disabled={isPending} onClick={() => save(false)}>
                Não é mais reembolsável
              </Button>
            </>
          ) : (
            <Button type="button" variant="primary" disabled={isPending} onClick={() => save(true)}>
              Marcar como reembolsável
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-body-sm text-fg-muted">
          Despesa reembolsável não conta nos gráficos nem no orçamento, e a receita que a devolve
          também não. O saldo das contas não muda.
        </p>

        {isLinked ? (
          <div className="rounded-lg border border-border bg-surface-2 p-3">
            <p className="text-caption text-fg-muted">Reembolsada por</p>
            <p className="mt-1 flex items-baseline justify-between gap-3 text-body">
              <span>{reimbursement?.linkedDescription}</span>
              <span className="text-income">
                <Money value={Number(reimbursement?.linkedAmount)} signed />
              </span>
            </p>
            {notReturned > 0 && (
              <p className="mt-2 text-caption text-fg-muted">
                <Money value={notReturned} /> não voltaram e continuam contando como gasto.
              </p>
            )}
          </div>
        ) : (
          <section aria-labelledby="reimbursement-candidates-h" className="flex flex-col gap-2">
            <h3 id="reimbursement-candidates-h" className="text-body font-semibold">
              Vincular a receita que devolveu o dinheiro
            </h3>
            {isLoading ? (
              <p className="text-body-sm text-fg-muted">Carregando receitas…</p>
            ) : candidates.length === 0 ? (
              <p className="text-body-sm text-fg-muted">
                Nenhuma receita sem vínculo de até <Money value={amount} />. Quando o dinheiro cair,
                volte aqui para vincular.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {candidates.map((income) => (
                  <li key={income.id} className="flex items-center gap-3 px-3 py-2">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-body">{income.description}</span>
                      <span className="text-caption text-fg-muted">
                        {fmtDateMedium(income.competenceDate)}
                        {income.accountName ? ` · ${income.accountName}` : ''}
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-income">
                      <Money value={Number(income.amount)} signed />
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending}
                      aria-label={`Vincular ${income.description}`}
                      onClick={() => save(true, income.id)}
                    >
                      Vincular
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </Modal>
  )
}
