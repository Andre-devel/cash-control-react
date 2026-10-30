import { useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import { useCreateAccount } from '@/features/accounts/hooks/use-create-account'
import {
  useApplyImportReconciliation,
  useImportReconciliation,
} from '@/features/transactions/hooks/use-import-reconciliation'
import type { ReconciliationKind, ReconciliationProposal } from '@/features/transactions/types'
import { formatLocalDate } from '@/lib/format-date'

const SECTIONS: { kind: ReconciliationKind; title: string; hint: string }[] = [
  {
    kind: 'INVOICE_PAYMENT',
    title: 'Pagamentos de fatura lançados como despesa',
    hint: 'Viram o pagamento da fatura: saem das despesas (as compras da fatura já estão lá) e a fatura fica paga.',
  },
  {
    kind: 'INVESTMENT',
    title: 'Aplicações e resgates lançados como despesa ou receita',
    hint: 'Viram transferência para a conta de investimento: saem das despesas/receitas e o patrimônio fica igual.',
  },
  {
    kind: 'SERIES_MERGE',
    title: 'Parcelamentos partidos em mais de uma série',
    hint: 'As parcelas passam para uma série só, a mais antiga.',
  },
]

function keyOf(proposal: ReconciliationProposal): string {
  return `${proposal.kind}:${proposal.id}`
}

interface ImportReconciliationDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Corrige lançamentos importados antes de o import reconhecer pagamento de fatura,
 * aplicação e parcelas de outro mês (D7). Mostra tudo antes; nada muda sem confirmação.
 */
export function ImportReconciliationDialog({ open, onClose }: ImportReconciliationDialogProps) {
  const { data, isLoading, isError, refetch } = useImportReconciliation(open)
  const { mutate: apply, isPending } = useApplyImportReconciliation()
  const { mutate: createAccount, isPending: isCreatingAccount } = useCreateAccount()
  // Guarda o que foi desmarcado, não o que está marcado: assim tudo já chega marcado
  // no primeiro render com a análise, sem um render intermediário com 0 selecionadas.
  const [deselected, setDeselected] = useState<Set<string>>(new Set())

  if (!open) return null

  const proposals = data?.proposals ?? []
  const selected = new Set(proposals.map(keyOf).filter((key) => !deselected.has(key)))

  function toggle(proposal: ReconciliationProposal) {
    setDeselected((current) => {
      const next = new Set(current)
      const key = keyOf(proposal)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleApply() {
    const items = proposals
      .filter((proposal) => selected.has(keyOf(proposal)))
      .map(({ kind, id }) => ({ kind, id }))
    apply({ items }, { onSuccess: onClose })
  }

  return (
    <Modal
      title="Corrigir importações antigas"
      subtitle="Lançamentos importados antes de o sistema reconhecer faturas, investimentos e parcelas de outros meses"
      onClose={onClose}
      xwide
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="button"
            variant="primary"
            onClick={handleApply}
            disabled={selected.size === 0}
            loading={isPending}
          >
            {isPending ? 'Aplicando…' : `Aplicar ${selected.size} correções`}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div
          className="flex flex-col gap-2"
          aria-busy="true"
          aria-label="Analisando seus lançamentos"
        >
          <p className="text-body-sm text-fg-muted">Analisando seus lançamentos…</p>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-surface-3 motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 rounded-lg bg-overdue-soft px-3.5 py-2.5 text-body-sm text-overdue"
        >
          Não foi possível analisar.
          <Button type="button" size="sm" variant="ghost" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {data?.investmentAccountMissing && (
            <div
              role="note"
              className="flex flex-col gap-2 rounded-lg bg-pending-soft px-3.5 py-2.5 text-body-sm"
            >
              <span>
                Há aplicações ou resgates lançados como despesa/receita, mas nenhuma conta de
                investimento para recebê-los.
              </span>
              <div>
                <Button
                  type="button"
                  size="sm"
                  loading={isCreatingAccount}
                  onClick={() =>
                    createAccount(
                      { name: 'Investimentos', type: 'INVESTMENT' },
                      { onSuccess: () => void refetch() },
                    )
                  }
                >
                  Criar conta &quot;Investimentos&quot;
                </Button>
              </div>
            </div>
          )}

          {proposals.length === 0 && !data?.investmentAccountMissing && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="grid size-12 place-items-center rounded-lg bg-paid-soft text-paid">
                <CircleCheck size={22} aria-hidden="true" />
              </span>
              <p className="text-body text-fg-muted">
                Nada a corrigir: os lançamentos importados estão em dia.
              </p>
            </div>
          )}

          {SECTIONS.map((section) => {
            const rows = proposals.filter((proposal) => proposal.kind === section.kind)
            if (rows.length === 0) return null
            return (
              <section
                key={section.kind}
                className="flex flex-col gap-2"
                aria-label={section.title}
              >
                <div>
                  <h3 className="text-body font-semibold">
                    {section.title} <span className="text-fg-muted">({rows.length})</span>
                  </h3>
                  <p className="text-caption text-fg-muted">{section.hint}</p>
                </div>
                <ul className="flex flex-col overflow-hidden rounded-lg border border-border">
                  {rows.map((proposal) => {
                    const isOn = selected.has(keyOf(proposal))
                    return (
                      <li key={keyOf(proposal)} className="border-t border-border first:border-t-0">
                        <label
                          className={`flex min-h-touch cursor-pointer items-start gap-3 px-3.5 py-3 hover:bg-surface-2 ${
                            isOn ? '' : 'opacity-70'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="checkbox mt-0.5 shrink-0"
                            aria-label={`Corrigir ${proposal.description} de ${formatLocalDate(proposal.date)}`}
                            checked={isOn}
                            onChange={() => toggle(proposal)}
                          />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="text-body font-medium">{proposal.description}</span>
                              <span className="whitespace-nowrap text-body font-semibold">
                                <Money value={Number(proposal.amount)} />
                              </span>
                            </span>
                            <span className="text-caption text-fg-muted">
                              {formatLocalDate(proposal.date)}
                              {proposal.accountName ? ` · ${proposal.accountName}` : ''}
                            </span>
                            {proposal.detail && (
                              <span className="text-caption text-fg-subtle">{proposal.detail}</span>
                            )}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
