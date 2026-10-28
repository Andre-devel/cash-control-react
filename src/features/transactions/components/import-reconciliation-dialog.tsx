import { useEffect, useState } from 'react'
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
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Tudo marcado ao chegar a análise: o usuário desmarca o que não quiser.
  useEffect(() => {
    if (data) setSelected(new Set(data.proposals.map(keyOf)))
  }, [data])

  if (!open) return null

  const proposals = data?.proposals ?? []

  function toggle(proposal: ReconciliationProposal) {
    setSelected((current) => {
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
            disabled={isPending || selected.size === 0}
            aria-busy={isPending}
          >
            {isPending ? 'Aplicando…' : `Aplicar ${selected.size} correções`}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <p className="text-sm text-dim">Analisando seus lançamentos…</p>
      ) : isError ? (
        <div role="alert" className="err">
          Não foi possível analisar.{' '}
          <Button type="button" size="sm" variant="ghost" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="col gap-4">
          {data?.investmentAccountMissing && (
            <div role="note" className="col gap-2 text-sm">
              <span>
                Há aplicações ou resgates lançados como despesa/receita, mas nenhuma conta de
                investimento para recebê-los.
              </span>
              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isCreatingAccount}
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
            <p className="text-sm text-dim">
              Nada a corrigir: os lançamentos importados estão em dia.
            </p>
          )}

          {SECTIONS.map((section) => {
            const rows = proposals.filter((proposal) => proposal.kind === section.kind)
            if (rows.length === 0) return null
            return (
              <section key={section.kind} className="col gap-2" aria-label={section.title}>
                <div>
                  <h3 className="fw-500" style={{ fontSize: 14 }}>
                    {section.title} ({rows.length})
                  </h3>
                  <p className="text-xs text-dim">{section.hint}</p>
                </div>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <tbody>
                      {rows.map((proposal) => (
                        <tr key={keyOf(proposal)}>
                          <td style={{ width: 36 }}>
                            <input
                              type="checkbox"
                              aria-label={`Corrigir ${proposal.description} de ${formatLocalDate(proposal.date)}`}
                              checked={selected.has(keyOf(proposal))}
                              onChange={() => toggle(proposal)}
                            />
                          </td>
                          <td>{formatLocalDate(proposal.date)}</td>
                          <td style={{ whiteSpace: 'normal' }}>
                            {proposal.description}
                            <div className="text-xs text-dim">{proposal.detail}</div>
                          </td>
                          <td className="text-dim">{proposal.accountName}</td>
                          <td className="num">
                            <Money value={Number(proposal.amount)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
